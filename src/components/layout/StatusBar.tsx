export function StatusBar() {
  // Placeholder state — will be wired to AppStore in later stories
  const saveState: 'saved' | 'unsaved' | 'error' = 'saved'
  const filename: string | null = null
  const nodeCount = 0
  const connectionCount = 0
  const selection: string | null = null

  const dotColor =
    saveState === 'saved'
      ? 'var(--green)'
      : saveState === 'unsaved'
        ? 'var(--yellow)'
        : 'var(--red)'

  const dotLabel =
    saveState === 'saved'
      ? 'Saved'
      : saveState === 'unsaved'
        ? 'Unsaved changes'
        : 'Error'

  return (
    <footer className="status-bar">
      {/* Save state */}
      <span className="status-save">
        <span
          className="status-dot"
          style={{ color: dotColor }}
          aria-label={dotLabel}
        >
          ●
        </span>
        <span className="status-dot-label">{dotLabel}</span>
      </span>

      {/* Active filename */}
      {filename && (
        <span className="status-filename">{filename}</span>
      )}

      {/* Diagram stats */}
      {filename && (
        <span className="status-stats">
          {nodeCount} nodes · {connectionCount} connections
        </span>
      )}

      {/* Selection info */}
      {selection && (
        <span className="status-selection">{selection} selected</span>
      )}
    </footer>
  )
}
