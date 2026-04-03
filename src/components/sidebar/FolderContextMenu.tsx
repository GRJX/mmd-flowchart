import { useEffect, useRef } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { createDirectory } from '../../lib/fileSystem'

interface FolderContextMenuProps {
  dirHandle: FileSystemDirectoryHandle
  position: { x: number; y: number }
  onClose: () => void
  onNewDiagram: (dirHandle: FileSystemDirectoryHandle) => void
}

export function FolderContextMenu({
  dirHandle,
  position,
  onClose,
  onNewDiagram,
}: FolderContextMenuProps) {
  const { addToast, refreshFileTree } = useAppStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  async function handleNewFolder() {
    onClose()
    const name = window.prompt('New folder name:')
    if (!name?.trim()) return
    try {
      await createDirectory(dirHandle, name.trim())
      await refreshFileTree()
      addToast(`Created folder "${name.trim()}"`, 'success')
    } catch (err) {
      addToast('Failed to create folder.', 'error')
      console.error(err)
    }
  }

  return (
    <div
      ref={ref}
      className="context-menu"
      style={{ position: 'fixed', left: position.x, top: position.y }}
      role="menu"
      aria-label="Folder actions"
    >
      <button
        className="context-menu-item"
        role="menuitem"
        onClick={() => { onClose(); onNewDiagram(dirHandle) }}
      >
        New Diagram here
      </button>
      <button className="context-menu-item" role="menuitem" onClick={handleNewFolder}>
        New Folder here
      </button>
    </div>
  )
}
