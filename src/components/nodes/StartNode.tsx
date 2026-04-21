import type { NodeProps } from '@xyflow/react'
import { ConnectionHandles } from './ConnectionHandles'
import { CommentDot } from './CommentDot'
import { NodeAddStem } from './NodeAddStem'
import { useNodeData } from './nodeHelpers'

export function StartNode({ id, data, selected }: NodeProps) {
  const { comments, canBeSource, hasViolation, hasBottomConnection } = useNodeData(data)
  const showStem = canBeSource && !hasBottomConnection

  return (
    // The root div grows to include the stem so the source handle lands at its tip.
    // When the stem is absent the root shrinks back to the circle dimensions.
    <div className={`node node--start ${selected ? 'node--selected' : ''} ${hasViolation ? 'node--violation' : ''}`}>
      <div className="node--start__circle">
        <span className="node-label node-label--nowrap">Start</span>
      </div>
      {showStem && <NodeAddStem nodeId={id} direction="bottom" inline />}
      {/* Source handle only while the stem is visible; positioned at the stem tip */}
      <ConnectionHandles
        sources={showStem ? ['bottom'] : []}
        targets={[]}
      />
      <CommentDot blockId={id} count={comments.length} />
    </div>
  )
}
