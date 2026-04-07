import { useAppStore } from '../../store/useAppStore'

export function StatusBar() {
  const diagram = useAppStore((s) => s.diagram)

  const saveState: 'saved' | 'unsaved' | 'error' = diagram?.isDirty ? 'unsaved' : 'saved'
  const filename: string | null = diagram?.name ?? null
  const nodeCount = diagram ? diagram.blocks.size : 0
  const connectionCount = diagram ? diagram.connections.size : 0
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
        ? 'Auto-saving…'
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
