import type { NodeProps } from '@xyflow/react'
import { useInlineEdit } from './StartNode'

/**
 * Decision block rendered as a diamond.
 * Uses a rotated-square technique: outer div is the container bounding box,
 * `.node-decision-shape` is the visible rotated square, and
 * `.node-decision-content` counter-rotates to keep the label upright.
 */
export function DecisionNode({ id, data, selected }: NodeProps) {
  const label = (data as { label: string }).label
  const { editing, draft, setDraft, startEdit, commitEdit, cancelEdit, inputRef } =
    useInlineEdit({ id, initialLabel: label })

  return (
    <div
      className={`node node--decision ${selected ? 'node--selected' : ''}`}
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
    </div>
  )
}
