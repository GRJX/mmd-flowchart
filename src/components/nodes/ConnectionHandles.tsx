import { Fragment } from 'react'
import { Handle, Position } from '@xyflow/react'

interface Props {
  /** Whether this node type can initiate connections (be a source). */
  canBeSource?: boolean
  /** Whether this node type can receive connections (be a target). */
  canBeTarget?: boolean
  /** Node type for special positioning (e.g., 'circle' for EndNode). */
  nodeType?: 'rectangle' | 'circle'
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
export function ConnectionHandles({ canBeSource = true, canBeTarget = true, nodeType = 'rectangle' }: Props) {
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
              style={getHandleStyle(pos, nodeType)}
            />
          )}
          {canBeTarget && (
            <Handle
              type="target"
              position={pos}
              id={`${id}-tgt`}
              className="conn-handle conn-handle--target"
              style={getHandleStyle(pos, nodeType)}
            />
          )}
        </Fragment>
      ))}
    </>
  )
}

function getHandleStyle(pos: Position, nodeType: 'rectangle' | 'circle' = 'rectangle'): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
  }

  if (nodeType === 'circle') {

    switch (pos) {
      case Position.Top:
        return { ...baseStyle, top: 0 }
      case Position.Right:
        return { ...baseStyle, right: '25%' }
      case Position.Bottom:
        return { ...baseStyle, bottom: 0 }
      case Position.Left:
        return { ...baseStyle, left: 0 }
      default:
        return baseStyle
    }
  }

  // Rectangle positioning (original logic)
  switch (pos) {
    case Position.Top:
      return { ...baseStyle, top: 0 }
    case Position.Right:
      return { ...baseStyle, right: 0 }
    case Position.Bottom:
      return { ...baseStyle, bottom: 0 }
    case Position.Left:
      return { ...baseStyle, left: 0 }
    default:
      return baseStyle
  }
}
