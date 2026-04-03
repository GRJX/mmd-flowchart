import { useState, useCallback } from 'react'
import { AppShell } from './components/layout/AppShell'
import { Toolbar } from './components/layout/Toolbar'
import { FileTree } from './components/sidebar/FileTree'
import { NewDiagramDialog } from './components/dialogs/NewDiagramDialog'
import { Toast } from './components/ui/Toast'
import { useAppStore } from './store/useAppStore'
import { useFileOpen } from './hooks/useFileOpen'
import { useDirectoryInit } from './hooks/useDirectoryInit'
import type { FileTreeNode } from './types/diagram'

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
  const { addToast, setDirectoryHandle } = useAppStore()
  const { openFile, createNewDiagram } = useFileOpen()
  const [newDiagramDir, setNewDiagramDir] = useState<FileSystemDirectoryHandle | undefined>(
    undefined,
  )
  const [showNewDiagram, setShowNewDiagram] = useState(false)

  // Restore last opened directory from IndexedDB on mount
  useDirectoryInit()

  const handleOpenFolder = useCallback(async () => {
    try {
      const handle = await (window as Window & typeof globalThis & {
        showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>
      }).showDirectoryPicker()
      await setDirectoryHandle(handle)
    } catch (err: unknown) {
      // User cancelled the picker — DOMException name 'AbortError'
      if (err instanceof DOMException && err.name === 'AbortError') return
      addToast('Could not open folder.', 'error')
      console.error(err)
    }
  }, [setDirectoryHandle, addToast])

  const handleFileClick = useCallback(
    (node: FileTreeNode) => {
      openFile(node)
    },
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

  return (
    <>
      <AppShell
        toolbar={
          <Toolbar
            onOpenFolder={handleOpenFolder}
            onNewDiagram={() => handleNewDiagram(undefined)}
          />
        }
        sidebar={
          <FileTree
            onFileClick={handleFileClick}
            onNewDiagram={handleNewDiagram}
            onOpenFolder={handleOpenFolder}
          />
        }
        canvas={<CanvasPlaceholder />}
        panel={<PanelPlaceholder />}
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

export default App

