import { Handle, Position } from '@xyflow/react'

type Dir = 'top' | 'right' | 'bottom' | 'left'

interface Props {
  /** Directions that expose a source (output) handle. Default: none. */
  sources?: Dir[]
  /** Directions that expose a target (input) handle. Default: all four. */
  targets?: Dir[]
  /**
   * Per-direction style overrides for handles.
   * Use this when the node wrapper is larger than the visual shape (e.g. includes
   * a stem), so handles can be pinned to the original shape's edges instead of
   * the wrapper's 50% midpoint.
   */
  handleStyles?: Partial<Record<Dir, React.CSSProperties>>
}

const DIR_TO_POSITION: Record<Dir, Position> = {
  top:    Position.Top,
  right:  Position.Right,
  bottom: Position.Bottom,
  left:   Position.Left,
}

const ALL_DIRS: Dir[] = ['top', 'right', 'bottom', 'left']

export function ConnectionHandles({ sources = [], targets = ALL_DIRS, handleStyles }: Props) {
  return (
    <>
      {sources.map((dir) => (
        <Handle
          key={`${dir}-src`}
          type="source"
          position={DIR_TO_POSITION[dir]}
          id={`${dir}-src`}
          className="conn-handle"
          style={handleStyles?.[dir]}
        />
      ))}
      {targets.map((dir) => (
        <Handle
          key={`${dir}-tgt`}
          type="target"
          position={DIR_TO_POSITION[dir]}
          id={`${dir}-tgt`}
          className="conn-handle conn-handle--target"
          style={handleStyles?.[dir]}
        />
      ))}
    </>
  )
}
