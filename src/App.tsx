import { AppShell } from './components/layout/AppShell'
import { Toolbar } from './components/layout/Toolbar'

function SidebarPlaceholder() {
  return (
    <div className="sidebar-empty">
      <span className="sidebar-empty-label">Open a folder to get started</span>
    </div>
  )
}

function CanvasPlaceholder() {
  return (
    <div className="canvas-empty">
      <span className="canvas-empty-title">No diagram open</span>
      <span className="canvas-empty-hint">Open a folder and select a .mmd file</span>
    </div>
  )
}

function PanelPlaceholder() {
  return (
    <div className="panel-empty">
      <span>Blocks</span>
    </div>
  )
}

function App() {
  return (
    <AppShell
      toolbar={<Toolbar />}
      sidebar={<SidebarPlaceholder />}
      canvas={<CanvasPlaceholder />}
      panel={<PanelPlaceholder />}
    />
  )
}

export default App
