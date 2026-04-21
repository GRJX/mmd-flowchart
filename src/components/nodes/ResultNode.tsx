import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useNodeData, useInlineEdit, InlineLabelEdit } from './nodeHelpers'
import { ConnectionHandles } from './ConnectionHandles'
import { CommentDot } from './CommentDot'
import { NodeAddStem } from './NodeAddStem'

const STEM_BTN_HALF = 11
const NODE_H = 96

export function ResultNode({ id, data, selected }: NodeProps) {
  const { label, comments, canBeSource, canBeTarget, hasViolation, hasBottomConnection } = useNodeData(data)
  const showStem = canBeSource && !hasBottomConnection
  const edit = useInlineEdit({ id, initialLabel: label })

  return (
    // Outer wrapper grows to include the stem; source handle lands at stem tip.
    <div className="node node--result-wrap">
      <div
        className={`node--result ${selected ? 'node--selected' : ''} ${hasViolation ? 'node--violation' : ''}`}
        onDoubleClick={edit.startEdit}
      >
        <InlineLabelEdit label={label} {...edit} />
      </div>
      {showStem && <NodeAddStem nodeId={id} direction="bottom" inline />}
      {showStem && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-src"
          className="conn-handle"
          style={{ bottom: STEM_BTN_HALF }}
        />
      )}
      <ConnectionHandles
        sources={[]}
        targets={canBeTarget ? (showStem ? ['top', 'right', 'left'] : ['top', 'right', 'bottom', 'left']) : []}
        handleStyles={{ left: { top: NODE_H / 2 }, right: { top: NODE_H / 2 } }}
      />
      <CommentDot blockId={id} count={comments.length} />
    </div>
  )
}
