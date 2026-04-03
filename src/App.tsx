import { useState, useCallback } from 'react'
import { ReactFlowProvider, useReactFlow } from '@xyflow/react'
import { AppShell } from './components/layout/AppShell'
import { Toolbar } from './components/layout/Toolbar'
import { FileTree } from './components/sidebar/FileTree'
import { NewDiagramDialog } from './components/dialogs/NewDiagramDialog'
import { Toast } from './components/ui/Toast'
import { DiagramCanvas } from './components/canvas/DiagramCanvas'
import { ReadOnlyPreview } from './components/canvas/ReadOnlyPreview'
import { RightPanel } from './components/panels/RightPanel'
import { useAppStore } from './store/useAppStore'
import { useFileOpen } from './hooks/useFileOpen'
import { useDirectoryInit } from './hooks/useDirectoryInit'
import { useSave } from './hooks/useSave'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { serializeDiagram } from './lib/serializer'
import type { BlockType, FileTreeNode } from './types/diagram'

/**
 * Inner app content — must be inside ReactFlowProvider to use useReactFlow().
 */
function AppContent() {
  const { addToast, setDirectoryHandle, addBlock, diagram } = useAppStore()
  const { openFile, createNewDiagram } = useFileOpen()
  const [newDiagramDir, setNewDiagramDir] = useState<FileSystemDirectoryHandle | undefined>(
    undefined,
  )
  const [showNewDiagram, setShowNewDiagram] = useState(false)

  const { zoomIn, zoomOut, fitView, getViewport, setViewport } = useReactFlow()

  // Restore last opened directory from IndexedDB on mount
  useDirectoryInit()

  // ── Serializer + save hook ─────────────────────────────────────────────────

  const serialize = useCallback(() => {
    if (!diagram) throw new Error('No diagram open.')
    const result = serializeDiagram(diagram)
    if (!result.ok) throw new Error(result.error)
    return result.content
  }, [diagram])

  const { save: handleSave } = useSave(diagram ? serialize : null)

  // ── Global keyboard shortcuts (undo/redo, arrow nudge) ────────────────────
  useKeyboardShortcuts()

  const handleOpenFolder = useCallback(async () => {
    try {
      const handle = await (window as Window & typeof globalThis & {
        showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>
      }).showDirectoryPicker()
      await setDirectoryHandle(handle)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      addToast('Could not open folder.', 'error')
      console.error(err)
    }
  }, [setDirectoryHandle, addToast])

  const handleFileClick = useCallback(
    (node: FileTreeNode) => { openFile(node) },
    [openFile],
  )

  const handleNewDiagram = useCallback(
    (dir?: FileSystemDirectoryHandle) => {
      setNewDiagramDir(dir)
      setShowNewDiagram(true)
    },
    [],
  )

  const handleNewDiagramCreate = useCallback(
    async (filename: string) => {
      await createNewDiagram(filename, newDiagramDir)
      setShowNewDiagram(false)
    },
    [createNewDiagram, newDiagramDir],
  )

  // ── Palette callbacks ─────────────────────────────────────────────────────

  /** Click in palette → add block at canvas center */
  const handlePaletteClickAdd = useCallback(
    (type: BlockType) => {
      const vp = getViewport()
      const el = document.querySelector('.react-flow__pane') as HTMLElement | null
      const rect = el?.getBoundingClientRect()
      if (!rect) return
      const position = {
        x: (-vp.x + rect.width / 2) / vp.zoom,
        y: (-vp.y + rect.height / 2) / vp.zoom,
      }
      addBlock(type, position)
    },
    [addBlock, getViewport],
  )

  // ── Toolbar zoom helpers ──────────────────────────────────────────────────
  const handleZoomIn = useCallback(() => zoomIn(), [zoomIn])
  const handleZoomOut = useCallback(() => zoomOut(), [zoomOut])
  const handleFitView = useCallback(() => fitView({ padding: 0.08 }), [fitView])
  const handleResetZoom = useCallback(() => {
    const vp = getViewport()
    setViewport({ x: vp.x, y: vp.y, zoom: 1 }, { duration: 200 })
  }, [getViewport, setViewport])

  return (
    <>
      <AppShell
        toolbar={
          <Toolbar
            onOpenFolder={handleOpenFolder}
            onNewDiagram={() => handleNewDiagram(undefined)}
            onSave={handleSave}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitView={handleFitView}
            onResetZoom={handleResetZoom}
          />
        }
        sidebar={
          <FileTree
            onFileClick={handleFileClick}
            onNewDiagram={handleNewDiagram}
            onOpenFolder={handleOpenFolder}
          />
        }
        canvas={
          diagram?.isReadOnly ? (
            <ReadOnlyPreview
              mmd={diagram.rawMmd ?? ''}
              reason={
                diagram.rawMmd && diagram.blocks.size === 0
                  ? undefined
                  : `This diagram has more than 200 blocks and is shown in read-only preview mode.`
              }
            />
          ) : (
            <DiagramCanvas />
          )
        }
        panel={
          <RightPanel
            onClickAdd={handlePaletteClickAdd}
          />
        }
      />

      {showNewDiagram && (
        <NewDiagramDialog
          onConfirm={handleNewDiagramCreate}
          onCancel={() => setShowNewDiagram(false)}
        />
      )}

      <Toast />
    </>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppContent />
    </ReactFlowProvider>
  )
}



