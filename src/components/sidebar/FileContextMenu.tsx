import { useEffect, useRef } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { deleteEntry, readFileText, createMmdFile } from '../../lib/fileSystem'
import type { FileTreeNode } from '../../types/diagram'

interface FileContextMenuProps {
  node: FileTreeNode
  parentHandle: FileSystemDirectoryHandle
  position: { x: number; y: number }
  onClose: () => void
  onRenameStart: () => void
}

export function FileContextMenu({
  node,
  parentHandle,
  position,
  onClose,
  onRenameStart,
}: FileContextMenuProps) {
  const { addToast, refreshFileTree, diagram, setDiagram } = useAppStore()
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

  async function handleDuplicate() {
    onClose()
    try {
      const content = await readFileText(node.handle as FileSystemFileHandle)
      const baseName = node.name.replace(/\.mmd$/, '')
      const newName = `${baseName}_copy.mmd`
      const newHandle = await createMmdFile(parentHandle, newName)
      const writable = await newHandle.createWritable()
      await writable.write(content)
      await writable.close()
      await refreshFileTree()
      addToast(`Duplicated as ${newName}`, 'success')
    } catch (err) {
      addToast('Failed to duplicate file.', 'error')
      console.error(err)
    }
  }

  async function handleDelete() {
    onClose()
    const confirmed = window.confirm(
      `Delete ${node.name}? This cannot be undone.`,
    )
    if (!confirmed) return
    try {
      // Close if currently open
      if (diagram?.name === node.name) setDiagram(null)
      await deleteEntry(parentHandle, node.name)
      await refreshFileTree()
      addToast(`Deleted ${node.name}`, 'info')
    } catch (err) {
      addToast('Failed to delete file.', 'error')
      console.error(err)
    }
  }

  return (
    <div
      ref={ref}
      className="context-menu"
      style={{ position: 'fixed', left: position.x, top: position.y }}
      role="menu"
      aria-label="File actions"
    >
      <button
        className="context-menu-item"
        role="menuitem"
        onClick={() => { onClose(); onRenameStart() }}
      >
        Rename
      </button>
      <button className="context-menu-item" role="menuitem" onClick={handleDuplicate}>
        Duplicate
      </button>
      <div className="context-menu-divider" />
      <button
        className="context-menu-item context-menu-item--danger"
        role="menuitem"
        onClick={handleDelete}
      >
        Delete
      </button>
    </div>
  )
}
