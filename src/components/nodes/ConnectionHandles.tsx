import { Fragment } from 'react'
import { Handle, Position } from '@xyflow/react'

interface Props {
  /** Whether this node type can initiate connections (be a source). */
  canBeSource?: boolean
  /** Whether this node type can receive connections (be a target). */
  canBeTarget?: boolean
}

const POSITIONS = [
  { pos: Position.Top,    id: 'top'    },
  { pos: Position.Right,  id: 'right'  },
  { pos: Position.Bottom, id: 'bottom' },
  { pos: Position.Left,   id: 'left'   },
]

/**
 * Renders 4 connection points (top / right / bottom / left) on a node.
 * Handles are positioned exactly on the block edges, or circle circumference for circular nodes.
 */
export function ConnectionHandles({ canBeSource = true, canBeTarget = true}: Props) {
  return (
    <>
      {POSITIONS.map(({ pos, id }) => (
        <Fragment key={id}>
          {canBeSource && (
            <Handle
              type="source"
              position={pos}
              id={`${id}-src`}
              className="conn-handle"
              style={getHandleStyle(pos)}
            />
          )}
          {canBeTarget && (
            <Handle
              type="target"
              position={pos}
              id={`${id}-tgt`}
              className="conn-handle conn-handle--target"
              style={getHandleStyle(pos)}
            />
          )}
        </Fragment>
      ))}
    </>
  )
}

function getHandleStyle(pos: Position): React.CSSProperties {
  switch (pos) {
    case Position.Top:    return { top: 0, }
    case Position.Right:  return { right: 0,}
    case Position.Bottom: return { bottom: 0,}
    case Position.Left:   return { left: 0, }
  }
}
