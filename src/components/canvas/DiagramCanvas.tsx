import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  SelectionMode,
  ConnectionMode,
  MarkerType,
  getSmoothStepPath,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeChange,
  type EdgeChange,
  type OnSelectionChangeParams,
  type ReactFlowInstance,
  type ConnectionLineComponentProps,
} from '@xyflow/react'
import { useAppStore } from '../../store/useAppStore'
import { getDragBlockType, setDragBlockType } from '../../lib/dragState'
import { canAddOutput, canAcceptInput, decisionSlotsUsed } from '../../lib/blockFactory'
import { BLOCK_CONFIG } from '../../lib/blockConfig'
import type { Block, BlockType, DiagramFile, NodeData } from '../../types/diagram'
import { StartNode } from '../nodes/StartNode'
import { EndNode } from '../nodes/EndNode'
import { ActionNode } from '../nodes/ActionNode'
import { DecisionNode } from '../nodes/DecisionNode'
import { ResultNode } from '../nodes/ResultNode'
import { OrthogonalEdge } from '../edges/OrthogonalEdge'
import { QuickAddMenu } from './QuickAddMenu'

// ── Node type map (constant outside component to prevent re-registration) ─────

const NODE_TYPES = {
  start: StartNode,
  end: EndNode,
  action: ActionNode,
  decision: DecisionNode,
  result: ResultNode,
} as const

// ── Edge type map ─────────────────────────────────────────────────────────────

const EDGE_TYPES = {
  orthogonal: OrthogonalEdge,
} as const

// ── Grid snapping ────────────────────────────────────────────────────────────

/** Grid size in logical canvas pixels — always on, no toggle (spec §8.0). */
export const GRID_SIZE = 16

/** Snap a value to the nearest GRID_SIZE multiple. */
function snap(v: number): number {
  return Math.round(v / GRID_SIZE) * GRID_SIZE
}

/** Returns a position aligned to the 16px grid. */
function snapToGrid(pos: { x: number; y: number }): { x: number; y: number } {
  return { x: snap(pos.x), y: snap(pos.y) }
}

// ── Node / edge converters ────────────────────────────────────────────────────

/** Convert Block dimensions per type, used for React Flow width/height hints */
function getNodeDimensions(block: Block): { width: number; height: number } {
  if (block.width != null && block.height != null) {
    return { width: block.width, height: block.height }
  }
  return BLOCK_CONFIG[block.type].dims
}

function diagramToRFNodes(diagram: DiagramFile): RFNode[] {
  // Pre-compute per-block aggregates that require scanning all connections first
  const inCounts     = new Map<string, number>()
  const outCounts    = new Map<string, number>()
  const decisionConns = new Map<string, { yes: boolean; no: boolean }>()
  // Tracks whether a connection leaves via the bottom-src handle (stem side)
  const hasBottomSrc = new Set<string>()

  for (const block of diagram.blocks.values()) {
    inCounts.set(block.id, 0)
    outCounts.set(block.id, 0)
    if (block.type === 'decision') decisionConns.set(block.id, { yes: false, no: false })
  }
  for (const conn of diagram.connections.values()) {
    inCounts.set(conn.targetId,  (inCounts.get(conn.targetId)  ?? 0) + 1)
    outCounts.set(conn.sourceId, (outCounts.get(conn.sourceId) ?? 0) + 1)
    const info = decisionConns.get(conn.sourceId)
    if (info) {
      if (conn.type === 'yes') info.yes = true
      if (conn.type === 'no')  info.no  = true
    }
    // A missing sourceHandle means the connection predates handle tracking and
    // was created via the bottom stem (default), so treat it as bottom-src.
    const handle = conn.sourceHandle ?? 'bottom-src'
    if (handle === 'bottom-src') hasBottomSrc.add(conn.sourceId)
  }

  return Array.from(diagram.blocks.values()).map((block) => {
    const dims     = getNodeDimensions(block)
    const inCount  = inCounts.get(block.id)  ?? 0
    const outCount = outCounts.get(block.id) ?? 0
    const { maxInputs: maxIn, maxOutputs: maxOut } = BLOCK_CONFIG[block.type]

    const typeSpecific = block.type === 'decision'
      ? { hasYConnection: decisionConns.get(block.id)!.yes, hasNConnection: decisionConns.get(block.id)!.no }
      : { hasBottomConnection: hasBottomSrc.has(block.id) }

    return {
      id: block.id,
      type: block.type,
      position: block.position,
      width: dims.width,
      height: dims.height,
      style: { width: dims.width, height: dims.height },
      data: {
        label: block.label,
        comments: block.comments,
        dataField: block.dataField,
        expectedOutcome: block.expectedOutcome,
        canBeSource:     true,
        canBeTarget:     true,
        canAddNewSource: outCount < maxOut,
        canAddNewTarget: inCount  < maxIn,
        hasViolation:    inCount  > maxIn || outCount > maxOut,
        ...typeSpecific,
      },
    }
  })
}

function diagramToRFEdges(diagram: DiagramFile): RFEdge[] {
  return Array.from(diagram.connections.values()).map((conn) => {
    // Use stored handles when available (set during manual connection dragging).
    // Fall back to type-based defaults for connections created before handle
    // tracking was introduced, or via quick-add.
    const sourceHandle = conn.sourceHandle ?? (conn.type === 'yes' ? 'right-src' : 'bottom-src')
    const targetHandle = conn.targetHandle ?? 'top-tgt'

    return {
      id: conn.id,
      source: conn.sourceId,
      target: conn.targetId,
      sourceHandle,
      targetHandle,
      type: 'orthogonal',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#5a6375',
      },
      data: { connectionType: conn.type, waypoints: conn.waypoints },
    }
  })
}

// ── Confirm delete dialog (inline, no external dependency) ────────────────────

interface DeleteConfirmProps {
  blockLabels: string[]
  onConfirm: () => void
  onCancel: () => void
}

function DeleteConfirmDialog({ blockLabels, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true">
      <div className="dialog">
        <h2 className="dialog-title">Delete block{blockLabels.length > 1 ? 's' : ''}?</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          {blockLabels.length === 1
            ? `"${blockLabels[0]}" has comments. Deleting will remove all attached comments.`
            : `${blockLabels.length} blocks have comments. All attached comments will be removed.`}
        </p>
        <div className="dialog-actions">
          <button className="dialog-btn dialog-btn--secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="dialog-btn dialog-btn--primary"
            style={{ background: 'var(--red)', borderColor: 'var(--red)' }}
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ── DiagramCanvas ─────────────────────────────────────────────────────────────

// ── Connection preview line ───────────────────────────────────────────────────
// Shown while the user drags a new connection, before it is committed.
// Uses the same orthogonal (smooth-step) routing as OrthogonalEdge so the
// preview matches the final edge exactly.

function ConnectionPreviewLine({
  fromX,
  fromY,
  fromPosition,
  toX,
  toY,
  toPosition,
}: ConnectionLineComponentProps) {
  const [d] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
    borderRadius: 10,
  })
  return (
    <g>
      <path
        fill="none"
        stroke="var(--edge-color)"
        strokeWidth={2}
        strokeDasharray="6 5"
        strokeOpacity={0.6}
        d={d}
      />
    </g>
  )
}

// ── Confirm delete dialog ─────────────────────────────────────────────────────

interface PendingDelete {
  ids: string[]
  labels: string[]
}

export function DiagramCanvas() {
  const {
    diagram,
    selection,
    setSelection,
    addBlock,
    deleteBlocks,
    moveBlocks,
    setCanvasViewport,
    addConnection,
    deleteConnection,
    setSelectedConnectionId,
    pendingQuickAdd,
    setPendingQuickAdd,
    quickAddAndConnect,
  } = useAppStore()

  const rfInstance = useRef<ReactFlowInstance | null>(null)
  const syncingFromRF = useRef(false)
  /** Track last-loaded diagram name so fitView only fires on true load-in. */
  const loadedDiagramName = useRef<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [dragPreview, setDragPreview] = useState<{ type: BlockType; x: number; y: number } | null>(null)

  // ── Edge selection (local RF state — not synced to store) ─────────────────
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set())

  const wrapRef = useRef<HTMLDivElement>(null)

  const [nodes, setNodes] = useNodesState<RFNode>([])
  const [edges, setEdges] = useEdgesState<RFEdge>([])

  // ── Sync store → RF when diagram changes from outside (not drag/etc.) ───────
  useEffect(() => {
    if (syncingFromRF.current) {
      syncingFromRF.current = false
      // Always re-sync edges so markerEnd objects stay current in RF state
      if (diagram) setEdges(diagramToRFEdges(diagram))
      return
    }
    if (diagram) {
      const newNodes = diagramToRFNodes(diagram)
      const newEdges = diagramToRFEdges(diagram)
      setNodes(newNodes)
      setEdges(newEdges)
      // Only fit view when a different file is loaded, not on every state mutation
      if (diagram.name !== loadedDiagramName.current) {
        loadedDiagramName.current = diagram.name
        setTimeout(() => rfInstance.current?.fitView({ padding: 0.08, maxZoom: 1 }), 50)
      }
    } else {
      loadedDiagramName.current = null
      setNodes([])
      setEdges([])
    }
  }, [diagram]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── RF onNodesChange — apply internal RF changes (drag, select, etc.) ───────
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds))
    },
    [setNodes],
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds))
    },
    [setEdges],
  )

  // ── On drag stop: sync moved positions back to store ─────────────────────────
  const handleNodeDragStop = useCallback(
    (_e: React.MouseEvent, _node: RFNode, movedNodes: RFNode[]) => {
      syncingFromRF.current = true
      moveBlocks(movedNodes.map((n) => ({ id: n.id, position: snapToGrid(n.position) })))
    },
    [moveBlocks],
  )

  // ── Selection sync ────────────────────────────────────────────────────────
  const handleSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: OnSelectionChangeParams) => {
      setSelection(new Set(selNodes.map((n) => n.id)))
      setSelectedEdgeIds(new Set(selEdges.map((e) => e.id)))
      // Sync to store so right panel can show connection properties
      const singleEdge = selEdges.length === 1 ? selEdges[0].id : null
      setSelectedConnectionId(singleEdge)
    },
    [setSelection, setSelectedConnectionId],
  )

  // ── Keyboard: Delete/Backspace deletes selected blocks and/or edges ───────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return

      // Check if an input/contenteditable is focused — skip delete in that case
      const tagName = (document.activeElement as HTMLElement)?.tagName
      if (tagName === 'INPUT' || tagName === 'TEXTAREA') return

      // Delete selected edges
      if (selectedEdgeIds.size > 0) {
        for (const eid of selectedEdgeIds) deleteConnection(eid)
        setSelectedEdgeIds(new Set())
        if (selection.size === 0) return
      }

      // Delete selected blocks
      if (!diagram || selection.size === 0) return

      const ids = Array.from(selection)
      const blocksWithComments = ids.filter((id) => {
        const b = diagram.blocks.get(id)
        return b && b.comments.length > 0
      })

      if (blocksWithComments.length > 0) {
        const labels = blocksWithComments.map(
          (id) => diagram.blocks.get(id)?.label ?? id,
        )
        setPendingDelete({ ids, labels })
      } else {
        deleteBlocks(ids)
      }
    },
    [diagram, selection, deleteBlocks, selectedEdgeIds, deleteConnection],
  )

  // ── Ctrl+A: select all ────────────────────────────────────────────────────
  const handleCtrlA = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        if (diagram) {
          setSelection(new Set(diagram.blocks.keys()))
          setNodes((nds) => nds.map((n) => ({ ...n, selected: true })))
        }
      }
    },
    [diagram, setSelection, setNodes],
  )

  // ── Drag preview node (injected while hovering over canvas) ──────────────
  const nodesWithPreview = useMemo<RFNode[]>(() => {
    if (!dragPreview) return nodes
    const dims = BLOCK_CONFIG[dragPreview.type].dims
    const previewNode: RFNode = {
      id: '__drag-preview__',
      type: dragPreview.type,
      position: { x: dragPreview.x, y: dragPreview.y },
      data: { label: '', isDragPreview: true, canBeSource: false, canBeTarget: false },
      width: dims.width,
      height: dims.height,
      style: { width: dims.width, height: dims.height, opacity: 0.5, pointerEvents: 'none' },
      selectable: false,
      draggable: false,
      focusable: false,
    }
    return [...nodes, previewNode]
  }, [nodes, dragPreview])

  // ── Drop from palette ─────────────────────────────────────────────────────
  const { screenToFlowPosition } = useReactFlow()

  // ── Connection validation ─────────────────────────────────────────────────
  const isValidConnection = useCallback(
    (connection: { source: string | null; target: string | null }) => {
      const { source, target } = connection
      if (!source || !target || !diagram) return false
      if (source === target) return false                          // no self-loops
      const src = diagram.blocks.get(source)
      const tgt = diagram.blocks.get(target)
      if (!src || !tgt) return false
      if (tgt.type === 'start') return false                       // start can't be target
      if (src.type === 'end')   return false                       // end can't be source
      if (!canAddOutput(diagram.connections, source, src.type))   return false
      if (!canAcceptInput(diagram.connections, target, tgt.type)) return false
      return true
    },
    [diagram],
  )

  // ── Connection creation ───────────────────────────────────────────────────
  const handleConnect = useCallback(
    (connection: {
      source: string | null
      target: string | null
      sourceHandle?: string | null
      targetHandle?: string | null
    }) => {
      const { source, target, sourceHandle, targetHandle } = connection
      if (!source || !target || !diagram) return
      const srcBlock = diagram.blocks.get(source)
      if (!srcBlock) return

      const sh = sourceHandle ?? undefined
      const th = targetHandle ?? undefined

      if (srcBlock.type === 'decision') {
        const { yes } = decisionSlotsUsed(diagram.connections, source)
        addConnection(source, target, yes ? 'no' : 'yes', sh, th)
      } else {
        addConnection(source, target, 'default', sh, th)
      }
    },
    [diagram, addConnection],
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      const type = getDragBlockType()
      if (!type) return
      const dims = BLOCK_CONFIG[type].dims
      const raw = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const snapped = snapToGrid({ x: raw.x - dims.width / 2, y: raw.y - dims.height / 2 })
      setDragPreview({ type, ...snapped })
    },
    [screenToFlowPosition],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragBlockType(null)
      setDragPreview(null)
      const type = e.dataTransfer.getData('application/block-type') as BlockType
      if (!type || !diagram) return
      const dims = BLOCK_CONFIG[type].dims
      const raw = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const pos = snapToGrid({ x: raw.x - dims.width / 2, y: raw.y - dims.height / 2 })
      addBlock(type, pos)
    },
    [diagram, addBlock, screenToFlowPosition],
  )

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return
    setDragBlockType(null)
    setDragPreview(null)
  }, [])

  // ── Click on canvas pane background → deselect all ────────────────────────
  const handlePaneClick = useCallback(() => {
    setSelection(new Set())
    setSelectedConnectionId(null)
  }, [setSelection, setSelectedConnectionId])

  // ── Viewport change → update store ───────────────────────────────────────
  const handleMoveEnd = useCallback(
    (_e: unknown, viewport: { x: number; y: number; zoom: number }) => {
      setCanvasViewport(viewport)
    },
    [setCanvasViewport],
  )

  // ── Canvas theme-aware grid dot color ─────────────────────────────────────
  // Detect the computed CSS var at runtime (handles light/dark mode switch)
  const gridColor = useMemo(() => {
    const isDark =
      !document.documentElement.hasAttribute('data-theme') ||
      document.documentElement.getAttribute('data-theme') === 'dark'
    return isDark ? '#252525' : '#E0E0E0'
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Empty canvas ──────────────────────────────────────────────────────────
  if (!diagram) {
    return (
      <div className="canvas-empty">
        <span className="canvas-empty-title">No diagram open</span>
        <span className="canvas-empty-hint">Open a folder and select a .mmd file</span>
      </div>
    )
  }

  return (
    <div
      ref={wrapRef}
      className="diagram-canvas-wrap"
      onKeyDown={(e) => {
        handleKeyDown(e)
        handleCtrlA(e)
      }}
      onDragLeave={handleDragLeave}
      tabIndex={-1}
    >
      <ReactFlow
        className="react-flow"
        nodes={nodesWithPreview}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onSelectionChange={handleSelectionChange}
        onPaneClick={handlePaneClick}
        onMoveEnd={handleMoveEnd}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onConnect={handleConnect}
        isValidConnection={isValidConnection}
        onInit={(instance) => { rfInstance.current = instance }}
        // Connection mode: closest handles for shortest path
        connectionMode={ConnectionMode.Loose}
        // Zoom: 10% – 400%
        minZoom={0.1}
        maxZoom={4}
        // Pan on left-drag; marquee on Shift+drag; middle mouse also pans
        panOnDrag={true}
        selectionOnDrag={true}
        selectionMode={SelectionMode.Full}
        panOnScroll={false}
        // Disable RF's built-in delete (we handle it ourselves for the comment guard)
        deleteKeyCode={null}
        // Multi-select via Shift
        multiSelectionKeyCode="Shift"
        // Select all via Ctrl+A (handled by our onKeyDown)
        selectionKeyCode={null}
        fitView={false}
        nodeOrigin={[0, 0]}
        snapToGrid={true}
        snapGrid={[GRID_SIZE, GRID_SIZE]}
        connectionLineComponent={ConnectionPreviewLine}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color={gridColor}
        />
      </ReactFlow>

      {pendingQuickAdd && (
        <QuickAddMenu
          screenPos={pendingQuickAdd.screenPos}
          onSelect={(type) => { quickAddAndConnect(type) }}
          onClose={() => setPendingQuickAdd(null)}
        />
      )}

      {pendingDelete && (        <DeleteConfirmDialog
          blockLabels={pendingDelete.labels}
          onConfirm={() => {
            deleteBlocks(pendingDelete.ids)
            setPendingDelete(null)
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}

    </div>
  )
}

// ── Click-to-center add helper (called from BlockPalette via App.tsx) ─────────

/**
 * Returns the logical canvas center of the current viewport.
 * Called when a user clicks a palette entry to add a block at canvas center.
 */
export function getCanvasCenter(instance: ReactFlowInstance | null): { x: number; y: number } {
  if (!instance) return { x: 0, y: 0 }
  const { x, y, zoom } = instance.getViewport()
  const el = document.querySelector('.react-flow__pane') as HTMLElement | null
  if (!el) return { x: 0, y: 0 }
  const rect = el.getBoundingClientRect()
  return {
    x: (-x + rect.width / 2) / zoom,
    y: (-y + rect.height / 2) / zoom,
  }
}
