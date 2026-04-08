import { useState, useRef } from 'react'
import type { FileTreeNode as FileTreeNodeType } from '../../types/diagram'
import { FolderIcon } from './icons/FolderIcon'
import { FileIcon } from './icons/FileIcon'
import { FileContextMenu } from './FileContextMenu'
import { FolderContextMenu } from './FolderContextMenu'
import { useAppStore } from '../../store/useAppStore'
import { renameFile, moveFileToFolder } from '../../lib/fileSystem'
import { ChevronRight, ChevronDown } from 'lucide-react'

/**
 * Module-level drag state shared across all FileTreeNode instances.
 * Cleared on dragend or after a successful drop.
 */
let activeDrag: { node: FileTreeNodeType; parentHandle: FileSystemDirectoryHandle } | null = null

interface FileTreeNodeProps {
  node: FileTreeNodeType
  depth: number
  parentHandle: FileSystemDirectoryHandle
  activeFilePath: string | null
  onFileClick: (node: FileTreeNodeType) => void
  onNewDiagram: (dirHandle: FileSystemDirectoryHandle) => void
}

export function FileTreeNode({
  node,
  depth,
  parentHandle,
  activeFilePath,
  onFileClick,
  onNewDiagram,
}: FileTreeNodeProps) {
  const { expandFolder, refreshFileTree, addToast } = useAppStore()
  const [expanded, setExpanded] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(node.name)
  const [isDragOver, setIsDragOver] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)

  const isActive = node.type === 'file' && activeFilePath === node.name
  const indentPx = depth * 12 + 8

  async function handleToggleExpand() {
    if (node.type !== 'folder') return
    if (!expanded && node.children === undefined) {
      await expandFolder(node)
    }
    setExpanded((v) => !v)
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  // ── Drag-and-drop (folders are drop targets; files are draggable) ──────────

  function handleDragStart(e: React.DragEvent) {
    // Minimal dataTransfer payload — real state lives in activeDrag
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', node.name)
    activeDrag = { node, parentHandle }
  }

  function handleDragEnd() {
    activeDrag = null
  }

  function handleDragOver(e: React.DragEvent) {
    if (!activeDrag || activeDrag.node.type !== 'file') return
    // Don't allow dropping into the same folder the file is already in
    if (activeDrag.parentHandle === node.handle) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear when leaving the folder row itself, not moving to a child element
    if (!e.currentTarget.contains(e.relatedTarget as Element)) {
      setIsDragOver(false)
    }
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (!activeDrag || activeDrag.node.type !== 'file') return
    const { node: draggedNode, parentHandle: srcHandle } = activeDrag
    activeDrag = null
    const destHandle = node.handle as FileSystemDirectoryHandle
    if (srcHandle === destHandle) return
    try {
      await moveFileToFolder(srcHandle, destHandle, draggedNode.name)
      // Auto-expand the destination folder so the user sees the moved file
      if (!expanded) {
        await expandFolder(node)
        setExpanded(true)
      }
      await refreshFileTree()
      addToast(`Moved "${draggedNode.name}" to ${node.name}`, 'success')
    } catch (err) {
      addToast(`Failed to move "${draggedNode.name}"`, 'error')
      console.error(err)
    }
  }

  async function handleRenameCommit() {
    const newName = renameValue.trim()
    setRenaming(false)
    if (!newName || newName === node.name) return
    const finalName = node.type === 'file' && !newName.endsWith('.mmd')
      ? `${newName}.mmd`
      : newName
    try {
      await renameFile(parentHandle, node.name, finalName)
      await refreshFileTree()
      addToast(`Renamed to ${finalName}`, 'success')
    } catch (err) {
      addToast('Failed to rename.', 'error')
      console.error(err)
    }
  }

  if (node.type === 'folder') {
    return (
      <>
        <div
          className={`tree-node tree-node--folder${isDragOver ? ' tree-node--drag-over' : ''}`}
          style={{ paddingLeft: indentPx }}
          onClick={handleToggleExpand}
          onContextMenu={handleContextMenu}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="treeitem"
          aria-expanded={expanded}
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleToggleExpand()}
        >
          <span className="tree-node-chevron">
            {expanded
              ? <ChevronDown size={12} strokeWidth={2} />
              : <ChevronRight size={12} strokeWidth={2} />
            }
          </span>
          <FolderIcon open={expanded} size={15} />
          <span className="tree-node-label">{node.name}</span>
        </div>

        {expanded && node.children && node.children.map((child) => (
          <FileTreeNode
            key={child.name}
            node={child}
            depth={depth + 1}
            parentHandle={node.handle as FileSystemDirectoryHandle}
            activeFilePath={activeFilePath}
            onFileClick={onFileClick}
            onNewDiagram={onNewDiagram}
          />
        ))}

        {contextMenu && (
          <FolderContextMenu
            dirHandle={node.handle as FileSystemDirectoryHandle}
            position={contextMenu}
            onClose={() => setContextMenu(null)}
            onNewDiagram={onNewDiagram}
          />
        )}
      </>
    )
  }

  // File node
  return (
    <>
      <div
        className={`tree-node tree-node--file ${isActive ? 'tree-node--active' : ''}`}
        style={{ paddingLeft: indentPx }}
        draggable={!renaming}
        onClick={() => !renaming && onFileClick(node)}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        role="treeitem"
        aria-selected={isActive}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !renaming && onFileClick(node)}
      >
        <span className="tree-node-chevron" aria-hidden="true" />
        <FileIcon size={14} />

        {renaming ? (
          <input
            ref={renameInputRef}
            className="tree-node-rename-input"
            value={renameValue}
            autoFocus
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameCommit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameCommit()
              if (e.key === 'Escape') setRenaming(false)
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="tree-node-label">{node.name}</span>
        )}
      </div>

      {contextMenu && (
        <FileContextMenu
          node={node}
          parentHandle={parentHandle}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
          onRenameStart={() => {
            setRenameValue(node.name)
            setRenaming(true)
            setTimeout(() => renameInputRef.current?.select(), 20)
          }}
        />
      )}
    </>
  )
}
