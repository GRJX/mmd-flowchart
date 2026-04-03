import { ArrowLeft } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import type { BlockType } from '../../types/diagram'
import { BlockPalette } from '../palette/BlockPalette'
import { BlockProperties } from './BlockProperties'
import { ConnectionProperties } from './ConnectionProperties'
import { CommentPanel } from './CommentPanel'

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  start: 'Start',
  end: 'End',
  action: 'Action',
  decision: 'Decision',
  result: 'Result',
}

interface RightPanelProps {
  onDragStart?: (e: React.DragEvent, type: BlockType) => void
  onClickAdd?: (type: BlockType) => void
}

export function RightPanel({ onDragStart, onClickAdd }: RightPanelProps) {
  const {
    selection,
    diagram,
    selectedConnectionId,
    commentPanelBlockId,
    setSelection,
    closeCommentPanel,
    setSelectedConnectionId,
  } = useAppStore()

  const selectedBlockId = selection.size === 1 ? Array.from(selection)[0] : null
  const selectedBlock = selectedBlockId ? (diagram?.blocks.get(selectedBlockId) ?? null) : null
  const selectedConnection =
    selectedConnectionId && diagram
      ? (diagram.connections.get(selectedConnectionId) ?? null)
      : null
  const commentBlock =
    commentPanelBlockId && diagram
      ? (diagram.blocks.get(commentPanelBlockId) ?? null)
      : null

  // ── Comment panel (takes priority over block properties) ──────────────────
  if (commentBlock && commentPanelBlockId) {
    return (
      <div className="right-panel">
        <div className="panel-header panel-header--properties">
          <button
            className="panel-back-btn"
            onClick={closeCommentPanel}
            aria-label="Back to properties"
          >
            <ArrowLeft size={14} strokeWidth={2} />
          </button>
          <span className="panel-header-title">Comments</span>
        </div>
        <CommentPanel blockId={commentPanelBlockId} />
      </div>
    )
  }

  // ── Block properties ───────────────────────────────────────────────────────
  if (selectedBlock) {
    const typeName = BLOCK_TYPE_LABELS[selectedBlock.type]
    return (
      <div className="right-panel">
        <div className="panel-header panel-header--properties">
          <button
            className="panel-back-btn"
            onClick={() => setSelection(new Set())}
            aria-label="Back to palette"
          >
            <ArrowLeft size={14} strokeWidth={2} />
          </button>
          <span className="panel-header-title">{typeName} Block</span>
        </div>
        <BlockProperties block={selectedBlock} />
      </div>
    )
  }

  // ── Connection properties ──────────────────────────────────────────────────
  if (selectedConnection && diagram) {
    return (
      <div className="right-panel">
        <div className="panel-header panel-header--properties">
          <button
            className="panel-back-btn"
            onClick={() => setSelectedConnectionId(null)}
            aria-label="Back to palette"
          >
            <ArrowLeft size={14} strokeWidth={2} />
          </button>
          <span className="panel-header-title">Connection</span>
        </div>
        <ConnectionProperties connection={selectedConnection} diagram={diagram} />
      </div>
    )
  }

  // ── Palette (default) ──────────────────────────────────────────────────────
  return <BlockPalette onDragStart={onDragStart} onClickAdd={onClickAdd} />
}
