import { useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'

interface NodeAddStemProps {
  nodeId: string
  direction: 'bottom' | 'right'
  /** When true, renders inline (in normal document flow). When false (default), renders
   *  with absolute positioning — caller must provide an appropriately sized container. */
  inline?: boolean
  style?: React.CSSProperties
}

export function NodeAddStem({ nodeId, direction, inline = false, style }: NodeAddStemProps) {
  const setPendingQuickAdd = useAppStore((s) => s.setPendingQuickAdd)

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setPendingQuickAdd({
        sourceNodeId: nodeId,
        direction,
        screenPos: { x: e.clientX, y: e.clientY },
      })
    },
    [nodeId, direction, setPendingQuickAdd],
  )

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
  }, [])

  const cls = [
    'node-add-stem',
    `node-add-stem--${direction}`,
    inline ? 'node-add-stem--inline' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={cls} aria-hidden style={style}>
      <div className="node-add-stem__line" />
      <button
        className="node-add-btn"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        aria-label={
          direction === 'bottom' ? 'Add connected node below' : 'Add connected node to the right'
        }
        tabIndex={0}
        type="button"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path
            d="M5 1V9M1 5H9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}
