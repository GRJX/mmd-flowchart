import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useNodeData, useInlineEdit, InlineLabelEdit } from './nodeHelpers'
import { ConnectionHandles } from './ConnectionHandles'
import { CommentDot } from './CommentDot'
import { NodeAddStem } from './NodeAddStem'

// Fixed diamond dimensions — must stay in sync with CSS .node--decision
const DIAMOND_W = 128
const DIAMOND_H = 96
// Stem: 32px line + 22px button = 54px total
const STEM_SIZE = 54
// Half of the 22px + button: distance from wrapper edge to button center (source handle anchor)
const SRC_OFFSET = 11
// How far inside the diamond edge target handles sit (keeps the dot visually on the shape)
const TGT_INSET = 5

/**
 * Decision block rendered as a diamond.
 *
 * The root wrapper's padding grows to include the stem areas so source handles
 * land exactly at the stem tips with 0 offset. When a connection is made the
 * stem and its padding are removed and the handle falls back to the diamond tip.
 *
 * Right stem  = Y (yes) path
 * Bottom stem = N (no)  path
 */
export function DecisionNode({ id, data, selected }: NodeProps) {
  const { label, comments, canBeSource, canBeTarget, hasViolation, hasYConnection, hasNConnection } = useNodeData(data)
  const showRight  = canBeSource && !hasYConnection
  const showBottom = canBeSource && !hasNConnection
  const edit = useInlineEdit({ id, initialLabel: label })

  return (
    // Wrapper padding reserves space for stems so bounding box includes them.
    <div
      className="node node--decision-wrap"
      style={{
        paddingRight:  showRight  ? STEM_SIZE : 0,
        paddingBottom: showBottom ? STEM_SIZE : 0,
      }}
    >
      {/* Diamond shape — fixed 128×96 */}
      <div
        className={`node--decision ${selected ? 'node--selected' : ''} ${hasViolation ? 'node--violation' : ''}`}
        onDoubleClick={edit.startEdit}
      >
        <div className="node-decision-shape" />
        <div className="node-decision-content">
          <InlineLabelEdit label={label} inputClassName="node-label-input node-label-input--decision" {...edit} />
        </div>
        {/* CommentDot inside the diamond div so it positions relative to the
            diamond shape, not the (potentially larger) wrapper. */}
        <CommentDot blockId={id} count={comments.length} />
      </div>

      {/* Stems — absolutely positioned at the diamond tips */}
      {showRight && (
        <NodeAddStem
          nodeId={id}
          direction="right"
          style={{
            position: 'absolute',
            left: DIAMOND_W,
            top: DIAMOND_H / 2,
            transform: 'translateY(-50%)',
          }}
        />
      )}
      {showBottom && (
        <NodeAddStem
          nodeId={id}
          direction="bottom"
          style={{
            position: 'absolute',
            top: DIAMOND_H,
            left: DIAMOND_W / 2,
            transform: 'translateX(-50%)',
          }}
        />
      )}

      {/* Source handles: centered on the + button (SRC_OFFSET = half button height/width) */}
      {showRight && (
        <Handle
          type="source"
          position={Position.Right}
          id="right-src"
          className="conn-handle"
          style={{ right: SRC_OFFSET, top: DIAMOND_H / 2 }}
        />
      )}
      {showBottom && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-src"
          className="conn-handle"
          style={{ bottom: SRC_OFFSET, left: DIAMOND_W / 2 }}
        />
      )}

      <ConnectionHandles
        sources={[]}
        targets={canBeTarget ? [
          'top',
          ...(showRight  ? [] : ['right'  as const]),
          ...(showBottom ? [] : ['bottom' as const]),
          'left',
        ] : []}
        handleStyles={{
          top:    { left: DIAMOND_W / 2 },
          right:  { top: DIAMOND_H / 2, right: TGT_INSET },
          bottom: { left: DIAMOND_W / 2, bottom: TGT_INSET },
          left:   { top: DIAMOND_H / 2 },
        }}
      />
    </div>
  )
}
