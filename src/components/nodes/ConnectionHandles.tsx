import { Fragment, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useAppStore } from '../../store/useAppStore'

interface Props {
  /** Whether this node type can initiate connections (be a source). */
  canBeSource?: boolean
  /** Whether this node type can receive connections (be a target). */
  canBeTarget?: boolean
  /** Node ID — required to enable the quick-add (+) button. */
  sourceNodeId?: string
}

const POSITIONS = [
  { pos: Position.Top,    id: 'top'    },
  { pos: Position.Right,  id: 'right'  },
  { pos: Position.Bottom, id: 'bottom' },
  { pos: Position.Left,   id: 'left'   },
]

/** Offset the + button outward from each handle edge. */
const QUICK_ADD_OFFSET: Record<string, React.CSSProperties> = {
  top:    { bottom: '100%', left: '50%', transform: 'translate(-50%, -4px)' },
  right:  { left: '100%',  top: '50%',  transform: 'translate(4px, -50%)' },
  bottom: { top: '100%',   left: '50%', transform: 'translate(-50%, 4px)' },
  left:   { right: '100%', top: '50%',  transform: 'translate(-4px, -50%)' },
}

/**
 * Renders 4 connection points (top / right / bottom / left) on a node.
 * Source handles appear on hover; target handles light up when a connection
 * is in-progress (controlled via CSS .react-flow--connecting).
 * When sourceNodeId is provided, hovering a source handle reveals a quick-add (+) button.
 */
export function ConnectionHandles({ canBeSource = true, canBeTarget = true, sourceNodeId }: Props) {
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null)
  const setPendingQuickAdd = useAppStore((s) => s.setPendingQuickAdd)

  return (
    <>
      {POSITIONS.map(({ pos, id }) => (
        <Fragment key={id}>
          {canBeSource && (
            <div
              className="conn-handle-wrap"
              style={{ position: 'absolute', ...getHandleWrapStyle(pos) }}
              onMouseEnter={() => setHoveredHandle(id)}
              onMouseLeave={() => setHoveredHandle(null)}
            >
              <Handle
                type="source"
                position={pos}
                id={`${id}-src`}
                className="conn-handle"
              />
              {sourceNodeId && hoveredHandle === id && (
                <button
                  className="quick-add-btn"
                  style={QUICK_ADD_OFFSET[id]}
                  aria-label={`Quick-add node from ${id} side`}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    setPendingQuickAdd({
                      sourceNodeId,
                      screenPos: { x: e.clientX, y: e.clientY },
                    })
                  }}
                >
                  +
                </button>
              )}
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
