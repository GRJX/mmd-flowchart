import { useEffect } from 'react'

interface Props {
  /** Label of the source Decision block */
  sourceLabel: string
  /** Whether a Y path already exists from this Decision block */
  hasY: boolean
  /** Whether an N path already exists from this Decision block */
  hasN: boolean
  onSelect: (type: 'yes' | 'no') => void
  onCancel: () => void
}

/**
 * Picker that appears after a connection is dropped from a Decision block.
 * Lets the user assign the connection as the Y path or N path.
 *
 * Dismiss behaviour (§9.2):
 *   - ✕ button in top-right corner
 *   - Pressing Escape removes draft + closes picker
 *   - Clicking the backdrop removes draft + closes picker
 */
export function YNPicker({ sourceLabel, hasY, hasN, onSelect, onCancel }: Props) {
  // Escape key dismiss
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onCancel() }
    }
    document.addEventListener('keydown', handler, { capture: true })
    return () => document.removeEventListener('keydown', handler, { capture: true })
  }, [onCancel])

  const bothExist = hasY && hasN

  return (
    <div
      className="yn-picker-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="yn-picker" role="dialog" aria-modal="true" aria-label="Choose connection type">

        {/* Header */}
        <div className="yn-picker-header">
          <span className="yn-picker-title">Choose path type</span>
          <button className="yn-picker-close" aria-label="Cancel" onClick={onCancel}>✕</button>
        </div>

        <p className="yn-picker-hint">
          From: <strong>{sourceLabel}</strong>
        </p>

        {/* Warning when redirecting an existing path */}
        {(hasY || hasN) && (
          <p className="yn-picker-warning">
            {bothExist
              ? 'Both paths already exist — selecting one will redirect it to the new target.'
              : hasY
              ? 'A Y path already exists — selecting Y will redirect it.'
              : 'An N path already exists — selecting N will redirect it.'}
          </p>
        )}

        {/* Y / N buttons */}
        <div className="yn-picker-buttons">
          <button
            className="yn-picker-btn yn-picker-btn--y"
            onClick={() => onSelect('yes')}
          >
            {hasY ? 'Redirect Y path' : 'Y path'}
          </button>
          <button
            className="yn-picker-btn yn-picker-btn--n"
            onClick={() => onSelect('no')}
          >
            {hasN ? 'Redirect N path' : 'N path'}
          </button>
        </div>

        <button className="yn-picker-cancel-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
