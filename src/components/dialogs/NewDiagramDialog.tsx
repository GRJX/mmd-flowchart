import { useState, useRef, useEffect } from 'react'

interface NewDiagramDialogProps {
  onConfirm: (filename: string) => void
  onCancel: () => void
}

export function NewDiagramDialog({ onConfirm, onCancel }: NewDiagramDialogProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = value.trim()
    if (!name) return
    const filename = name.endsWith('.mmd') ? name : `${name}.mmd`
    onConfirm(filename)
  }

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" aria-label="New Diagram">
      <div className="dialog">
        <h2 className="dialog-title">New Diagram</h2>
        <form onSubmit={handleSubmit}>
          <label className="dialog-label" htmlFor="new-diagram-name">
            Filename:
          </label>
          <input
            ref={inputRef}
            id="new-diagram-name"
            className="dialog-input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="my-diagram"
            autoComplete="off"
            spellCheck={false}
          />
          <p className="dialog-hint">.mmd extension added automatically</p>
          <div className="dialog-actions">
            <button type="button" className="dialog-btn dialog-btn--secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="dialog-btn dialog-btn--primary" disabled={!value.trim()}>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
