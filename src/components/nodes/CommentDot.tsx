import { useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'

interface CommentDotProps {
  blockId: string
  count: number
}

/**
 * Red dot indicator for blocks with comments (spec §10.1).
 * - 18×18px minimum; centered on the top-right corner of the block
 * - Solid #f87171 background with 2px canvas-background border (halo)
 * - Always shows a numeric badge (even for a single comment)
 * - Click selects the block and opens the comment panel
 */
export function CommentDot({ blockId, count }: CommentDotProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      const store = useAppStore.getState()
      store.setSelection(new Set([blockId]))
      store.openCommentPanel(blockId)
    },
    [blockId],
  )

  if (count === 0) return null

  return (
    <div
      className="comment-dot"
      role="button"
      tabIndex={0}
      aria-label={`${count} comment${count !== 1 ? 's' : ''} — click to view`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          const store = useAppStore.getState()
          store.setSelection(new Set([blockId]))
          store.openCommentPanel(blockId)
        }
      }}
    >
      {count > 0 && <span className="comment-dot-badge">{count}</span>}
    </div>
  )
}
