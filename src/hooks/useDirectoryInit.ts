import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { loadDirectoryHandle } from '../lib/indexedDb'
import { readDirectoryEntries } from '../lib/fileSystem'

/**
 * On application mount, attempt to restore the last opened directory
 * from IndexedDB. If `queryPermission` returns 'granted', it loads
 * the file tree without re-prompting the user.
 */
export function useDirectoryInit() {
  const setDirectoryHandle = useAppStore((s) => s.setDirectoryHandle)

  useEffect(() => {
    let cancelled = false

    async function restore() {
      const handle = await loadDirectoryHandle()
      if (!handle || cancelled) return

      try {
        // Check if we already have (or can regain) read/write permission
        const perm = await (handle as FileSystemDirectoryHandle & {
          queryPermission: (opts: { mode: string }) => Promise<PermissionState>
          requestPermission: (opts: { mode: string }) => Promise<PermissionState>
        }).queryPermission({ mode: 'readwrite' })

        if (perm === 'granted' && !cancelled) {
          // Persist handle and build file tree via existing store action
          const tree = await readDirectoryEntries(handle)
          if (!cancelled) {
            // Set directly without re-saving to IndexedDB (it's already there)
            useAppStore.setState({
              directoryHandle: handle,
              fileTree: tree,
              selectedFolderHandle: null,
            })
          }
        }
        // If 'prompt' or 'denied' — do nothing; user must re-open the folder
      } catch {
        // queryPermission not supported in older browsers — silently skip
      }
    }

    restore()
    return () => {
      cancelled = true
    }
  }, [setDirectoryHandle])
}
