import { useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'

interface NodeAddStemProps {
  nodeId: string
  direction: 'bottom' | 'right'
}

/**
 * Always-visible "add next node" affordance.
 * Renders a short line + circle (+) button extending from the bottom or
 * right edge of a node. Clicking the button opens the radial fan quick-add menu.
 *
 * Positioning relies on the parent node having overflow: visible (already set
 * in the .node base class). The stem sits OUTSIDE the React Flow hit-area so
 * it never triggers node drag or selection.
 */
export function NodeAddStem({ nodeId, direction }: NodeAddStemProps) {
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

  // Prevent React Flow from starting a node drag when pressing the button
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
  }, [])

  return (
    <div
      className={`node-add-stem node-add-stem--${direction}`}
      // Stem is decorative chrome; the button carries the accessible label
      aria-hidden
    >
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
        {/* SVG plus icon — scales cleanly at any dpi */}
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
