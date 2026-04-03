import { useState, useRef, useCallback } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useAppStore } from '../../store/useAppStore'

export function StartNode({ selected }: NodeProps) {
  // Start block label is always "Start" — non-editable per spec §7.1
  return (
    <div className={`node node--start ${selected ? 'node--selected' : ''}`}>
      <span className="node-label">Start</span>
    </div>
  )
}

// ── Shared inline-edit hook used by editable node types ───────────────────────

export interface UseInlineEditOptions {
  id: string
  initialLabel: string
}

export function useInlineEdit({ id, initialLabel }: UseInlineEditOptions) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialLabel)
  const inputRef = useRef<HTMLInputElement>(null)
  const updateBlockLabel = useAppStore((s) => s.updateBlockLabel)

  const startEdit = useCallback(() => {
    setDraft(initialLabel)
    setEditing(true)
    // Focus input after next paint
    requestAnimationFrame(() => inputRef.current?.select())
  }, [initialLabel])

  const commitEdit = useCallback(() => {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== initialLabel) {
      updateBlockLabel(id, trimmed)
    }
  }, [draft, id, initialLabel, updateBlockLabel])

  const cancelEdit = useCallback(() => {
    setEditing(false)
    setDraft(initialLabel)
  }, [initialLabel])

  return { editing, draft, setDraft, startEdit, commitEdit, cancelEdit, inputRef }
}
