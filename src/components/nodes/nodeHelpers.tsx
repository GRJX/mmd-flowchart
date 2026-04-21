import { useState, useRef, useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { NodeData } from '../../types/diagram'

// ── Shared data hook ──────────────────────────────────────────────────────────

export function useNodeData(data: unknown): NodeData {
  const d = data as Partial<NodeData>
  return {
    label:               d.label               ?? '',
    comments:            d.comments            ?? [],
    dataField:           d.dataField           ?? null,
    expectedOutcome:     d.expectedOutcome      ?? null,
    canBeSource:         d.canBeSource          ?? true,
    canBeTarget:         d.canBeTarget          ?? true,
    canAddNewSource:     d.canAddNewSource      ?? true,
    canAddNewTarget:     d.canAddNewTarget      ?? true,
    hasViolation:        d.hasViolation         ?? false,
    hasBottomConnection: d.hasBottomConnection  ?? false,
    hasYConnection:      d.hasYConnection       ?? false,
    hasNConnection:      d.hasNConnection       ?? false,
  }
}

// ── Shared inline-edit hook ───────────────────────────────────────────────────

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

// ── Shared inline-edit JSX ────────────────────────────────────────────────────

interface InlineLabelEditProps {
  editing: boolean
  draft: string
  label: string
  inputRef: React.RefObject<HTMLInputElement>
  inputClassName?: string
  setDraft: (v: string) => void
  commitEdit: () => void
  cancelEdit: () => void
}

export function InlineLabelEdit({
  editing, draft, label, inputRef,
  inputClassName = 'node-label-input',
  setDraft, commitEdit, cancelEdit,
}: InlineLabelEditProps) {
  if (!editing) return <span className="node-label">{label}</span>
  return (
    <input
      ref={inputRef}
      className={inputClassName}
      value={draft}
      autoFocus
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commitEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter')  { e.preventDefault(); commitEdit() }
        if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
        e.stopPropagation()
      }}
      onClick={(e) => e.stopPropagation()}
    />
  )
}
