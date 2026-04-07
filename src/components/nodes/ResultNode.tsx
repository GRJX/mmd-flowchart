import type { NodeProps } from '@xyflow/react'
import { useInlineEdit } from './StartNode'
import { ConnectionHandles } from './ConnectionHandles'
import { CommentDot } from './CommentDot'

export function ResultNode({ id, data, selected }: NodeProps) {
  const d = data as { label: string; comments?: unknown[]; canBeSource?: boolean; canBeTarget?: boolean; hasViolation?: boolean }
  const label = d.label
  const comments = d.comments ?? []
  const canBeSource  = d.canBeSource  ?? true
  const canBeTarget  = d.canBeTarget  ?? true
  const hasViolation = d.hasViolation ?? false
  const { editing, draft, setDraft, startEdit, commitEdit, cancelEdit, inputRef } =
    useInlineEdit({ id, initialLabel: label })

  return (
    <div
      className={`node node--result ${selected ? 'node--selected' : ''} ${hasViolation ? 'node--violation' : ''}`}
      onDoubleClick={startEdit}
    >
      {editing ? (
        <input
          ref={inputRef}
          className="node-label-input"
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
      <ConnectionHandles canBeSource={canBeSource} canBeTarget={canBeTarget} />
      <CommentDot blockId={id} count={comments.length} />
    </div>
  )
}
