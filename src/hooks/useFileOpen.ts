import { useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import { readFileText, getFileLastModified, createMmdFile } from '../lib/fileSystem'
import type { FileTreeNode, DiagramFile, Block } from '../types/diagram'

// Initial .mmd content for a new diagram (single Start block)
const INITIAL_MMD = `%% MMD_META_START
%% {"version":"1","meta":{"S":{"dataField":null,"expectedOutcome":null,"position":{"x":360,"y":240},"comments":[]}},"connections":{}}
%% MMD_META_END
flowchart TD
    S([Start])
`

function buildNewDiagram(
  handle: FileSystemFileHandle,
  name: string,
): DiagramFile {
  const startBlock: Block = {
    id: 'S',
    type: 'start',
    label: 'Start',
    position: { x: 360, y: 240 },
    dataField: null,
    expectedOutcome: null,
    comments: [],
  }

  return {
    path: name,
    name,
    directionHint: 'TD',
    blocks: new Map([['S', startBlock]]),
    connections: new Map(),
    isDirty: true,
    lastSavedAt: null,
    fileHandle: handle,
    metadataVersion: '1',
  }
}

function buildDiagramFromText(
  handle: FileSystemFileHandle,
  name: string,
  _text: string,
  lastModified: number,
): DiagramFile {
  // Parsing is implemented in S7.3 — stub returns an empty diagram shell
  // that marks the file as loaded with the correct handle
  return {
    path: name,
    name,
    directionHint: 'TD',
    blocks: new Map(),
    connections: new Map(),
    isDirty: false,
    lastSavedAt: new Date(lastModified),
    fileHandle: handle,
    metadataVersion: null,
  }
}

export function useFileOpen() {
  const { setDiagram, addToast, refreshFileTree, directoryHandle, selectedFolderHandle } =
    useAppStore()

  /**
   * Open an existing .mmd file node from the file tree.
   * Detects external changes since last load.
   */
  const openFile = useCallback(
    async (node: FileTreeNode) => {
      if (node.type !== 'file') return
      const handle = node.handle as FileSystemFileHandle

      try {
        const lastModified = await getFileLastModified(handle)
        const currentDiagram = useAppStore.getState().diagram

        // External-change detection: if same file is already open & re-clicked
        if (currentDiagram?.name === node.name) {
          if (
            currentDiagram.lastSavedAt &&
            lastModified > currentDiagram.lastSavedAt.getTime()
          ) {
            const text = await readFileText(handle)
            const updated = buildDiagramFromText(handle, node.name, text, lastModified)
            setDiagram(updated)
            addToast('File changed on disk. Reloaded.', 'info')
            return
          }
          return // already open, no change
        }

        const text = await readFileText(handle)
        const diagram = buildDiagramFromText(handle, node.name, text, lastModified)
        setDiagram(diagram)
      } catch (err) {
        addToast('Failed to open file.', 'error')
        console.error(err)
      }
    },
    [setDiagram, addToast],
  )

  /**
   * Create a new .mmd file in the given directory (or selectedFolder / root).
   */
  const createNewDiagram = useCallback(
    async (filename: string, inDir?: FileSystemDirectoryHandle) => {
      const targetDir = inDir ?? selectedFolderHandle ?? directoryHandle
      if (!targetDir) {
        addToast('Open a folder first.', 'warning')
        return
      }

      try {
        const handle = await createMmdFile(targetDir, filename)
        const diagram = buildNewDiagram(handle, filename.endsWith('.mmd') ? filename : `${filename}.mmd`)

        // Write initial content
        const writable = await handle.createWritable()
        await writable.write(INITIAL_MMD)
        await writable.close()
        diagram.isDirty = true
        diagram.lastSavedAt = null

        setDiagram(diagram)
        await refreshFileTree()
      } catch (err) {
        addToast('Failed to create diagram.', 'error')
        console.error(err)
      }
    },
    [setDiagram, addToast, refreshFileTree, directoryHandle, selectedFolderHandle],
  )

  return { openFile, createNewDiagram }
}
