import type { NodeProps } from '@xyflow/react'
import { useInlineEdit } from './StartNode'
import { ConnectionHandles } from './ConnectionHandles'
import { CommentDot } from './CommentDot'

/**
 * Decision block rendered as a diamond.
 * Uses a rotated-square technique: outer div is the container bounding box,
 * `.node-decision-shape` is the visible rotated square, and
 * `.node-decision-content` counter-rotates to keep the label upright.
 * Orange border variant when Y or N path is missing (spec §9.4).
 */
export function DecisionNode({ id, data, selected }: NodeProps) {
  const d = data as { label: string; hasYConnection?: boolean; hasNConnection?: boolean; comments?: unknown[]; canBeSource?: boolean; canBeTarget?: boolean; hasViolation?: boolean }
  const label = d.label
  const comments = d.comments ?? []
  const incomplete   = !d.hasYConnection || !d.hasNConnection
  const canBeSource  = d.canBeSource  ?? true
  const canBeTarget  = d.canBeTarget  ?? true
  const hasViolation = d.hasViolation ?? false
  const { editing, draft, setDraft, startEdit, commitEdit, cancelEdit, inputRef } =
    useInlineEdit({ id, initialLabel: label })

  return (
    <div
      className={`node node--decision ${selected ? 'node--selected' : ''} ${incomplete ? 'node--incomplete' : ''} ${hasViolation ? 'node--violation' : ''}`}
      onDoubleClick={startEdit}
    >
      {/* Rotated square is the visible diamond — absolute positioned */}
      <div className="node-decision-shape" />

      {/* Counter-rotated content keeps label horizontal */}
      <div className="node-decision-content">
        {editing ? (
          <input
            ref={inputRef}
            className="node-label-input node-label-input--decision"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
              if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="node-label">{label}</span>
        )}
      </div>

      <ConnectionHandles canBeSource={canBeSource} canBeTarget={canBeTarget} />
      <CommentDot blockId={id} count={comments.length} />
    </div>
  )
}
