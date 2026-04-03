import type { ReactNode } from 'react'
import { StatusBar } from './StatusBar'

interface AppShellProps {
  toolbar: ReactNode
  sidebar: ReactNode
  canvas: ReactNode
  panel: ReactNode
}

export function AppShell({ toolbar, sidebar, canvas, panel }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-toolbar">{toolbar}</header>

      <div className="app-body">
        <aside className="app-sidebar">{sidebar}</aside>
        <main className="app-canvas">{canvas}</main>
        <aside className="app-panel">{panel}</aside>
      </div>

      <StatusBar />
    </div>
  )
}
