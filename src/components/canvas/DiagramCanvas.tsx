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
  MarkerType,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeChange,
  type EdgeChange,
  type OnSelectionChangeParams,
  type ReactFlowInstance,
} from '@xyflow/react'
import { useAppStore } from '../../store/useAppStore'
import { getDragBlockType, setDragBlockType } from '../../lib/dragState'
import { MAX_INPUTS, MAX_OUTPUTS } from '../../lib/blockFactory'
import type { Block, BlockType, DiagramFile } from '../../types/diagram'
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

/** Default dimensions per block type. */
const DEFAULT_NODE_DIMS: Record<BlockType, { width: number; height: number }> = {
  start:    { width: 120, height: 52  },
  end:      { width: 120, height: 52  },
  action:   { width: 120, height: 88  },
  result:   { width: 120, height: 88  },
  decision: { width: 120, height: 88  },
}

/** Convert Block dimensions per type, used for React Flow width/height hints */
function getNodeDimensions(block: Block): { width: number; height: number } {
  if (block.width != null && block.height != null) {
    return { width: block.width, height: block.height }
  }
  return DEFAULT_NODE_DIMS[block.type]
}

function blockToRFNode(block: Block): RFNode {
  const dims = getNodeDimensions(block)
  return {
    id: block.id,
    type: block.type,
    position: block.position,
    data: {
      label: block.label,
      comments: block.comments,
      dataField: block.dataField,
      expectedOutcome: block.expectedOutcome,
    },
    width: dims.width,
    height: dims.height,
    style: { width: dims.width, height: dims.height },
  }
}

function diagramToRFNodes(diagram: DiagramFile): RFNode[] {
  // Pre-compute in/out counts and Decision Y/N paths for all blocks
  const inCounts  = new Map<string, number>()
  const outCounts = new Map<string, number>()
  const decisionConns = new Map<string, { yes: boolean; no: boolean }>()

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
  }

  return Array.from(diagram.blocks.values()).map((block) => {
    const node     = blockToRFNode(block)
    const inCount  = inCounts.get(block.id)  ?? 0
    const outCount = outCounts.get(block.id) ?? 0
    const maxIn    = MAX_INPUTS[block.type]
    const maxOut   = MAX_OUTPUTS[block.type]

    node.data = {
      ...node.data,
      canBeSource:  outCount < maxOut,
      canBeTarget:  inCount  < maxIn,
      hasViolation: inCount > maxIn || outCount > maxOut,
    }

    if (block.type === 'decision') {
      const info = decisionConns.get(block.id)!
      node.data = { ...node.data, hasYConnection: info.yes, hasNConnection: info.no }
    }
    return node
  })
}

function diagramToRFEdges(diagram: DiagramFile): RFEdge[] {
  return Array.from(diagram.connections.values()).map((conn) => ({
    id: conn.id,
    source: conn.sourceId,
    target: conn.targetId,
    type: 'orthogonal',
    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#9ca3af' },
    data: { connectionType: conn.type, waypoints: conn.waypoints },
  }))
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

// ── Drop ghost overlay ─────────────────────────────────────────────────────

function DropGhost({ type, x, y }: { type: BlockType; x: number; y: number }) {
  const dims = DEFAULT_NODE_DIMS[type]
  return (
    <div
      className={`node node--${type} drop-ghost-overlay`}
      style={{ position: 'absolute', left: x, top: y, width: dims.width, height: dims.height }}
    >
      {type === 'decision' && <div className="node-decision-shape" />}
      {type === 'start'    && <div className="node--start__circle" />}
      {type === 'end'      && <div className="node--end__circle" />}
    </div>
  )
}

// ── DiagramCanvas ─────────────────────────────────────────────────────────────

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

  // ── Edge selection (local RF state — not synced to store) ─────────────────
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set())

  // ── Drop ghost (palette → canvas drag preview) ────────────────────────────
  const wrapRef = useRef<HTMLDivElement>(null)
  const [dropGhost, setDropGhost] = useState<{ type: BlockType; x: number; y: number } | null>(null)
  const lastSnapRef = useRef<{ x: number; y: number }>({ x: -1e9, y: -1e9 })

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
      setNodes(diagramToRFNodes(diagram))
      setEdges(diagramToRFEdges(diagram))
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

  // ── Drop from palette ─────────────────────────────────────────────────────
  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow()

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
      // Enforce per-block output limit
      const srcOutCount = Array.from(diagram.connections.values())
        .filter((c) => c.sourceId === source).length
      if (srcOutCount >= MAX_OUTPUTS[src.type]) return false
      // Enforce per-block input limit
      const tgtInCount = Array.from(diagram.connections.values())
        .filter((c) => c.targetId === target).length
      if (tgtInCount >= MAX_INPUTS[tgt.type]) return false
      return true
    },
    [diagram],
  )

  // ── Connection creation ───────────────────────────────────────────────────
  const handleConnect = useCallback(
    (connection: { source: string | null; target: string | null }) => {
      const { source, target } = connection
      if (!source || !target || !diagram) return
      const srcBlock = diagram.blocks.get(source)
      if (!srcBlock) return

      if (srcBlock.type === 'decision') {
        // Auto-assign: use the first unoccupied Y/N slot
        let hasY = false
        for (const conn of diagram.connections.values()) {
          if (conn.sourceId === source && conn.type === 'yes') hasY = true
        }
        addConnection(source, target, hasY ? 'no' : 'yes')
      } else {
        addConnection(source, target, 'default')
      }
    },
    [diagram, addConnection],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'

    const type = getDragBlockType()
    if (!type || !wrapRef.current) return

    const snapped = snapToGrid(screenToFlowPosition({ x: e.clientX, y: e.clientY }))
    const last = lastSnapRef.current
    if (last.x === snapped.x && last.y === snapped.y) return   // no grid change
    lastSnapRef.current = snapped

    const screenPt = flowToScreenPosition(snapped)
    const rect = wrapRef.current.getBoundingClientRect()
    setDropGhost({ type, x: screenPt.x - rect.left, y: screenPt.y - rect.top })
  }, [screenToFlowPosition, flowToScreenPosition])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDropGhost(null)
      setDragBlockType(null)
      lastSnapRef.current = { x: -1e9, y: -1e9 }
      const type = e.dataTransfer.getData('application/block-type') as BlockType
      if (!type || !diagram) return

      const rawPosition = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      addBlock(type, snapToGrid(rawPosition))
    },
    [diagram, addBlock, screenToFlowPosition],
  )

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Only clear when leaving the entire canvas wrapper (not crossing child elements)
    if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return
    setDropGhost(null)
    setDragBlockType(null)
    lastSnapRef.current = { x: -1e9, y: -1e9 }
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
        nodes={nodes}
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
        connectionMode="loose"
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
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color={gridColor}
        />
      </ReactFlow>

      {dropGhost && <DropGhost {...dropGhost} />}

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
