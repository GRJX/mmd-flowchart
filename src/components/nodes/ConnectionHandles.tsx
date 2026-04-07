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
 * Source handles appear on hover; target handles light up when a connection
 * is in-progress (controlled via CSS .react-flow--connecting).
 */
export function ConnectionHandles({ canBeSource = true, canBeTarget = true }: Props) {
  return (
    <>
      {POSITIONS.map(({ pos, id }) => (
        <Fragment key={id}>
          {canBeSource && (
            <div
              className="conn-handle-wrap"
              style={{ position: 'absolute', ...getHandleWrapStyle(pos) }}
            >
              <Handle
                type="source"
                position={pos}
                id={`${id}-src`}
                className="conn-handle"
              />
            </div>
          )}
          {canBeTarget && (
            <Handle
              type="target"
              position={pos}
              id={`${id}-tgt`}
              className="conn-handle conn-handle--target"
            />
          )}
        </Fragment>
      ))}
    </>
  )
}

function getHandleWrapStyle(pos: Position): React.CSSProperties {
  switch (pos) {
    case Position.Top:    return { top: 0,    left: '50%', transform: 'translate(-50%, -50%)' }
    case Position.Right:  return { right: 0,  top: '50%',  transform: 'translate(50%, -50%)' }
    case Position.Bottom: return { bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' }
    case Position.Left:   return { left: 0,   top: '50%',  transform: 'translate(-50%, -50%)' }
  }
}
