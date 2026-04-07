import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { StatusBar } from './StatusBar'

const LEFT_DEFAULT = 240
const LEFT_MIN = 160
const LEFT_MAX = 480
const RIGHT_DEFAULT = 280
const RIGHT_MIN = 200
const RIGHT_MAX = 500
/** Width of the grip strip (resize handle + collapse button) */
const GRIP_W = 28

interface AppShellProps {
  toolbar: ReactNode
  sidebar: ReactNode
  canvas: ReactNode
  panel: ReactNode
}

export function AppShell({ toolbar, sidebar, canvas, panel }: AppShellProps) {
  const [leftWidth, setLeftWidth]       = useState(LEFT_DEFAULT)
  const [rightWidth, setRightWidth]     = useState(RIGHT_DEFAULT)
  const [leftCollapsed, setLeftCollapsed]   = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)

  // ── Resize drag helpers ────────────────────────────────────────────────────

  const startLeftDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startW = leftWidth
      const onMove = (ev: MouseEvent) => {
        setLeftWidth(Math.min(LEFT_MAX, Math.max(LEFT_MIN, startW + (ev.clientX - startX))))
      }
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [leftWidth],
  )

  const startRightDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startW = rightWidth
      const onMove = (ev: MouseEvent) => {
        setRightWidth(Math.min(RIGHT_MAX, Math.max(RIGHT_MIN, startW + (startX - ev.clientX))))
      }
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [rightWidth],
  )

  const sidebarW = leftCollapsed  ? GRIP_W : leftWidth
  const panelW   = rightCollapsed ? GRIP_W : rightWidth

  return (
    <div className="app-shell">
      <header className="app-toolbar">{toolbar}</header>

      <div className="app-body">

        {/* ── Left panel ──────────────────────────────────────────────────── */}
        <aside
          className={`app-sidebar${leftCollapsed ? ' app-sidebar--collapsed' : ''}`}
          style={{ width: sidebarW, flexBasis: sidebarW }}
        >
          <div className="panel-inner">{sidebar}</div>

          {/* Grip: resize zone + collapse toggle */}
          <div
            className="panel-grip"
            onMouseDown={leftCollapsed ? undefined : startLeftDrag}
            style={{ cursor: leftCollapsed ? 'default' : 'col-resize' }}
          >
            <button
              className="panel-collapse-btn"
              onClick={() => setLeftCollapsed((c) => !c)}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label={leftCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {leftCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
          </div>
        </aside>

        <main className="app-canvas">{canvas}</main>

        {/* ── Right panel ─────────────────────────────────────────────────── */}
        <aside
          className={`app-panel${rightCollapsed ? ' app-panel--collapsed' : ''}`}
          style={{ width: panelW, flexBasis: panelW }}
        >
          {/* Grip: collapse toggle + resize zone */}
          <div
            className="panel-grip"
            onMouseDown={rightCollapsed ? undefined : startRightDrag}
            style={{ cursor: rightCollapsed ? 'default' : 'col-resize' }}
          >
            <button
              className="panel-collapse-btn"
              onClick={() => setRightCollapsed((c) => !c)}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label={rightCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {rightCollapsed ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
            </button>
          </div>

          <div className="panel-inner">{panel}</div>
        </aside>

      </div>

      <StatusBar />
    </div>
  )
}
