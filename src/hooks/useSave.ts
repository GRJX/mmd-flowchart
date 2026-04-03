import { useEffect, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import { writeFileAtomic, getFileLastModified } from '../lib/fileSystem'

/**
 * useSave — Ctrl/Cmd+S save with:
 * - Atomic write pattern (§9.3)
 * - External-change detection
 * - beforeunload guard when isDirty
 * - Serialization is a stub here — will call serializer in S7.2
 */
export function useSave(serialize: (() => string) | null) {
  const { diagram, addToast } = useAppStore()

  // ── beforeunload guard ─────────────────────────────────────────────────────
  useEffect(() => {
    const isDirty = diagram?.isDirty ?? false

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }

    if (isDirty) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [diagram?.isDirty])

  // ── Save function ──────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!diagram || !serialize) return

    const content = serialize()

    try {
      // External-change detection: compare lastSavedAt vs file.lastModified
      if (diagram.lastSavedAt) {
        const lastModified = await getFileLastModified(diagram.fileHandle)
        if (lastModified > diagram.lastSavedAt.getTime()) {
          const overwrite = window.confirm(
            'This file has been modified on disk. Overwrite with your changes, or discard and reload?',
          )
          if (!overwrite) {
            // Reload from disk — handled by caller/useFileOpen
            return 'reload'
          }
        }
      }

      // Atomic write (§9.3 steps 3-6)
      await writeFileAtomic(diagram.fileHandle, content)

      useAppStore.getState().setDiagramDirty(false)
      useAppStore.setState((s) =>
        s.diagram
          ? { diagram: { ...s.diagram, lastSavedAt: new Date() } }
          : {},
      )
    } catch (err) {
      addToast('Save failed. Your file was not changed.', 'error')
      console.error(err)
    }
  }, [diagram, serialize, addToast])

  // ── Keyboard shortcut ──────────────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [save])

  return { save }
}
