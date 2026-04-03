/**
 * ReadOnlyPreview — renders an uneditable Mermaid diagram via mermaid.js.
 *
 * Shown when:
 *  - The opened file has a non-flowchart/graph diagram type  (§9.2 rule 4)
 *  - The diagram has more than 200 blocks                    (§12.3)
 */

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { useAppStore } from '../../store/useAppStore'

interface ReadOnlyPreviewProps {
  mmd: string
  reason?: string
}

let diagramCounter = 0

export function ReadOnlyPreview({ mmd, reason }: ReadOnlyPreviewProps) {
  const theme = useAppStore((s) => s.theme)
  const containerRef = useRef<HTMLDivElement>(null)
  const [renderError, setRenderError] = useState<string | null>(null)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'strict',
    })
  }, [theme])

  useEffect(() => {
    if (!containerRef.current || !mmd.trim()) return

    const id = `mmd-readonly-${++diagramCounter}`

    mermaid
      .render(id, mmd)
      .then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
          setRenderError(null)
        }
      })
      .catch((err: unknown) => {
        console.error('[ReadOnlyPreview] mermaid render error', err)
        setRenderError('Could not render the diagram.')
      })
  }, [mmd, theme])

  return (
    <div className="readonly-preview">
      <div className="readonly-banner" role="status" aria-live="polite">
        <span className="readonly-banner__icon" aria-hidden="true">⚠</span>
        <span className="readonly-banner__text">
          {reason ??
            'This diagram could not be loaded for editing. It is shown in read-only preview mode.'}
        </span>
      </div>

      {renderError ? (
        <div className="readonly-error">{renderError}</div>
      ) : (
        <div
          ref={containerRef}
          className="readonly-diagram"
          aria-label="Read-only diagram preview"
        />
      )}
    </div>
  )
}
