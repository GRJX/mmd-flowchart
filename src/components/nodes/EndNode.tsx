import type { NodeProps } from '@xyflow/react'
import { ConnectionHandles } from './ConnectionHandles'
import { CommentDot } from './CommentDot'

export function EndNode({ id, data, selected }: NodeProps) {
  const d = data as { comments?: unknown[]; canBeTarget?: boolean; hasViolation?: boolean }
  const comments = d.comments ?? []
  const canBeTarget = d.canBeTarget ?? true
  const hasViolation = d.hasViolation ?? false

  return (
    <div className={`node node--end ${selected ? 'node--selected' : ''} ${hasViolation ? 'node--violation' : ''}`}>
      <div className="node--end__circle">
        <span className="node-label node-label--nowrap">End</span>
      </div>
      <ConnectionHandles
        sources={[]}
        targets={canBeTarget ? ['top', 'right', 'bottom', 'left'] : []}
      />
      <CommentDot blockId={id} count={comments.length} />
    </div>
  )
}
