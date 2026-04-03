import type { NodeProps } from '@xyflow/react'
import { useInlineEdit } from './StartNode'
import { ConnectionHandles } from './ConnectionHandles'
import { CommentDot } from './CommentDot'

export function EndNode({ id, data, selected }: NodeProps) {
  const d = data as { label: string; comments?: unknown[] }
  const label = d.label
  const comments = d.comments ?? []
  const { editing, draft, setDraft, startEdit, commitEdit, cancelEdit, inputRef } =
    useInlineEdit({ id, initialLabel: label })

  return (
    <div
      className={`node node--end ${selected ? 'node--selected' : ''}`}
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
      {/* End can only be a target — never a connection source (§9.1) */}
      <ConnectionHandles canBeSource={false} canBeTarget={true} />
      <CommentDot blockId={id} count={comments.length} />
    </div>
  )
}
