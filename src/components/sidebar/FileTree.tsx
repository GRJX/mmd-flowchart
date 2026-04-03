import { useAppStore } from '../../store/useAppStore'
import { FileTreeNode } from './FileTreeNode'
import { FolderOpen } from 'lucide-react'
import type { FileTreeNode as FileTreeNodeType } from '../../types/diagram'

interface FileTreeProps {
  onFileClick: (node: FileTreeNodeType) => void
  onNewDiagram: (dirHandle: FileSystemDirectoryHandle) => void
  onOpenFolder: () => void
}

export function FileTree({ onFileClick, onNewDiagram, onOpenFolder }: FileTreeProps) {
  const { directoryHandle, fileTree, diagram } = useAppStore()

  if (!directoryHandle) {
    return (
      <div className="sidebar-empty">
        <span className="sidebar-empty-label">Open a folder to get started</span>
        <button className="sidebar-open-btn" onClick={onOpenFolder}>
          <FolderOpen size={14} strokeWidth={1.75} />
          <span>Open Folder</span>
        </button>
      </div>
    )
  }

  return (
    <div className="file-tree" role="tree" aria-label="File explorer">
      <div className="file-tree-header">
        <span className="file-tree-dir-name">{directoryHandle.name.toUpperCase()}</span>
      </div>
      {fileTree.length === 0 ? (
        <div className="file-tree-empty">No .mmd files found</div>
      ) : (
        fileTree.map((node) => (
          <FileTreeNode
            key={node.name}
            node={node}
            depth={0}
            parentHandle={directoryHandle}
            activeFilePath={diagram?.name ?? null}
            onFileClick={onFileClick}
            onNewDiagram={onNewDiagram}
          />
        ))
      )}
    </div>
  )
}
