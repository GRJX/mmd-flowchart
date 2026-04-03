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
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeChange,
  type EdgeChange,
  type OnSelectionChangeParams,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useAppStore } from '../../store/useAppStore'
import type { Block, BlockType, DiagramFile } from '../../types/diagram'
import { StartNode } from '../nodes/StartNode'
import { EndNode } from '../nodes/EndNode'
import { ActionNode } from '../nodes/ActionNode'
import { DecisionNode } from '../nodes/DecisionNode'
import { ResultNode } from '../nodes/ResultNode'

// ── Node type map (constant outside component to prevent re-registration) ─────

const NODE_TYPES = {
  start: StartNode,
  end: EndNode,
  action: ActionNode,
  decision: DecisionNode,
  result: ResultNode,
} as const

// ── Node / edge converters ────────────────────────────────────────────────────

/** Convert Block dimensions per type, used for React Flow width/height hints */
function getNodeDimensions(type: BlockType): { width: number; height: number } {
  if (type === 'start' || type === 'end') return { width: 140, height: 44 }
  if (type === 'decision') return { width: 110, height: 110 }
  return { width: 160, height: 52 }
}

function blockToRFNode(block: Block): RFNode {
  const dims = getNodeDimensions(block.type)
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
  return Array.from(diagram.blocks.values()).map(blockToRFNode)
}

function diagramToRFEdges(diagram: DiagramFile): RFEdge[] {
  return Array.from(diagram.connections.values()).map((conn) => ({
    id: conn.id,
    source: conn.sourceId,
    target: conn.targetId,
    label: conn.type === 'yes' ? 'Y' : conn.type === 'no' ? 'N' : undefined,
    type: 'default',
    data: { connectionType: conn.type },
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
  } = useAppStore()

  const rfInstance = useRef<ReactFlowInstance | null>(null)
  const syncingFromRF = useRef(false)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)

  const [nodes, setNodes] = useNodesState<RFNode>([])
  const [edges, setEdges] = useEdgesState<RFEdge>([])

  // ── Sync store → RF when diagram changes from outside (not drag/etc.) ───────
  useEffect(() => {
    if (syncingFromRF.current) {
      syncingFromRF.current = false
      return
    }
    if (diagram) {
      setNodes(diagramToRFNodes(diagram))
      setEdges(diagramToRFEdges(diagram))
      // Fit view after new diagram loads — small delay for layout
      setTimeout(() => rfInstance.current?.fitView({ padding: 0.08 }), 50)
    } else {
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
      moveBlocks(movedNodes.map((n) => ({ id: n.id, position: n.position })))
    },
    [moveBlocks],
  )

  // ── Selection sync ────────────────────────────────────────────────────────
  const handleSelectionChange = useCallback(
    ({ nodes: selNodes }: OnSelectionChangeParams) => {
      setSelection(new Set(selNodes.map((n) => n.id)))
    },
    [setSelection],
  )

  // ── Keyboard: Delete/Backspace deletes selected blocks ────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      if (!diagram || selection.size === 0) return

      // Check if an input/contenteditable is focused — skip delete in that case
      const tagName = (document.activeElement as HTMLElement)?.tagName
      if (tagName === 'INPUT' || tagName === 'TEXTAREA') return

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
    [diagram, selection, deleteBlocks],
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
  const { screenToFlowPosition } = useReactFlow()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const type = e.dataTransfer.getData('application/block-type') as BlockType
      if (!type || !diagram) return

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      addBlock(type, position)
    },
    [diagram, addBlock, screenToFlowPosition],
  )

  // ── Click on canvas pane background → deselect all ────────────────────────
  const handlePaneClick = useCallback(() => {
    setSelection(new Set())
  }, [setSelection])

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
      className="diagram-canvas-wrap"
      onKeyDown={(e) => {
        handleKeyDown(e)
        handleCtrlA(e)
      }}
      tabIndex={-1}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onSelectionChange={handleSelectionChange}
        onPaneClick={handlePaneClick}
        onMoveEnd={handleMoveEnd}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onInit={(instance) => { rfInstance.current = instance }}
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
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color={gridColor}
        />
      </ReactFlow>

      {pendingDelete && (
        <DeleteConfirmDialog
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
