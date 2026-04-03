import { useState, useEffect, useRef } from 'react'
import {
  FolderOpen,
  Save,
  FilePlus,
  Download,
  Maximize2,
  ZoomOut,
  ZoomIn,
  Undo2,
  Redo2,
  Sun,
  Moon,
  ChevronDown,
  GitBranch,
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

interface ToolbarProps {
  onOpenFolder?: () => void
  onNewDiagram?: () => void
  onSave?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitView?: () => void
  onResetZoom?: () => void
  onExportPng?: () => void
  onExportSvg?: () => void
}

export function Toolbar({ onOpenFolder, onNewDiagram, onSave, onZoomIn, onZoomOut, onFitView, onResetZoom, onExportPng, onExportSvg }: ToolbarProps) {
  const { theme, toggleTheme, canvasViewport, diagram, undoStack, redoStack, undo, redo } = useAppStore()
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showExportMenu) return
    function handleClickOutside(e: MouseEvent) {
      if (exportWrapRef.current && !exportWrapRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu])

  const zoom = Math.round((canvasViewport?.zoom ?? 1) * 100)
  const canUndo = undoStack.length > 0
  const canRedo = redoStack.length > 0
  const hasOpenFile = diagram !== null

  function handleZoomPercentDoubleClick() {
    onResetZoom?.()
  }

  return (
    <div className="toolbar">
      {/* ── Left group ─────────────────────────────────── */}

      {/* App logo / name */}
      <div className="toolbar-logo" aria-label="MMD Flowchart Editor">
        <GitBranch size={16} strokeWidth={2} className="toolbar-logo-icon" />
        <span className="toolbar-logo-text">MMD</span>
      </div>

      <div className="toolbar-divider" />

      {/* Open Folder */}
      <button className="toolbar-btn" title="Open Folder" aria-label="Open Folder" onClick={onOpenFolder}>
        <FolderOpen size={16} strokeWidth={1.75} />
        <span className="toolbar-btn-label">Open Folder</span>
      </button>

      {/* Save */}
      <button
        className="toolbar-btn"
        disabled={!hasOpenFile}
        title="Save (Ctrl+S)"
        aria-label="Save"
        onClick={onSave}
      >
        <Save size={16} strokeWidth={1.75} />
      </button>

      {/* New Diagram */}
      <button className="toolbar-btn" title="New Diagram" aria-label="New Diagram" onClick={onNewDiagram}>
        <FilePlus size={16} strokeWidth={1.75} />
      </button>

      {/* Export dropdown */}
      <div className="toolbar-dropdown-wrap" ref={exportWrapRef}>
        <button
          className="toolbar-btn toolbar-btn--dropdown"
          disabled={!hasOpenFile}
          title="Export"
          aria-label="Export"
          aria-haspopup="menu"
          aria-expanded={showExportMenu}
          onClick={() => setShowExportMenu(s => !s)}
        >
          <Download size={16} strokeWidth={1.75} />
          <span className="toolbar-btn-label">Export</span>
          <ChevronDown size={12} strokeWidth={2} className={`toolbar-chevron${showExportMenu ? ' toolbar-chevron--open' : ''}`} />
        </button>
        {showExportMenu && (
          <div className="toolbar-dropdown-menu" role="menu">
            <button
              className="toolbar-dropdown-item"
              role="menuitem"
              onClick={() => { onExportPng?.(); setShowExportMenu(false) }}
            >
              Export as PNG
            </button>
            <button
              className="toolbar-dropdown-item"
              role="menuitem"
              onClick={() => { onExportSvg?.(); setShowExportMenu(false) }}
            >
              Export as SVG
            </button>
          </div>
        )}
      </div>

      {/* ── Flexible spacer ────────────────────────────── */}
      <div className="toolbar-spacer" aria-hidden="true" />

      {/* ── Right group ────────────────────────────────── */}

      {/* Fit to Screen */}
      <button
        className="toolbar-btn"
        disabled={!hasOpenFile}
        title="Fit to Screen (Ctrl+Shift+F)"
        aria-label="Fit to Screen"
        onClick={onFitView}
      >
        <Maximize2 size={16} strokeWidth={1.75} />
      </button>

      {/* Zoom Out */}
      <button
        className="toolbar-btn"
        disabled={!hasOpenFile}
        title="Zoom Out"
        aria-label="Zoom Out"
        onClick={onZoomOut}
      >
        <ZoomOut size={16} strokeWidth={1.75} />
      </button>

      {/* Zoom % */}
      <button
        className="toolbar-zoom-pct"
        disabled={!hasOpenFile}
        title="Double-click to reset zoom to 100%"
        aria-label={`Zoom level ${zoom}%`}
        onDoubleClick={handleZoomPercentDoubleClick}
      >
        {zoom}%
      </button>

      {/* Zoom In */}
      <button
        className="toolbar-btn"
        disabled={!hasOpenFile}
        title="Zoom In"
        aria-label="Zoom In"
        onClick={onZoomIn}
      >
        <ZoomIn size={16} strokeWidth={1.75} />
      </button>

      <div className="toolbar-divider" />

      {/* Undo */}
      <button
        className="toolbar-btn"
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        onClick={undo}
      >
        <Undo2 size={16} strokeWidth={1.75} />
      </button>

      {/* Redo */}
      <button
        className="toolbar-btn"
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        aria-label="Redo"
        onClick={redo}
      >
        <Redo2 size={16} strokeWidth={1.75} />
      </button>

      <div className="toolbar-divider" />

      {/* Dark Mode toggle */}
      <button
        className="toolbar-btn toolbar-btn--theme"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-pressed={theme === 'light'}
      >
        {theme === 'dark' ? (
          <Sun size={16} strokeWidth={1.75} />
        ) : (
          <Moon size={16} strokeWidth={1.75} />
        )}
      </button>
    </div>
  )
}
