import { useEffect, useRef } from 'react'
import type { BlockType } from '../../types/diagram'

// ── Available block types in the quick-add menu ───────────────────────────────

interface BlockOption {
  type: BlockType
  label: string
  description: string
  icon: string
}

const BLOCK_OPTIONS: BlockOption[] = [
  { type: 'action',   label: 'Action',   description: 'A step in the flow',       icon: '▭' },
  { type: 'decision', label: 'Decision', description: 'Branch on a condition',     icon: '◇' },
  { type: 'result',   label: 'Result',   description: 'An outcome / output',       icon: '▣' },
  { type: 'end',      label: 'End',      description: 'Terminate the flow',        icon: '⬭' },
]

// ── Component ─────────────────────────────────────────────────────────────────

interface QuickAddMenuProps {
  /** Screen-space position near which to render the menu. */
  screenPos: { x: number; y: number }
  onSelect: (type: BlockType) => void
  onClose: () => void
}

/**
 * Floating node-type picker for Contextual Predictive Creation.
 * Opens at the clicked quick-add (+) button location and allows the user
 * to choose what kind of block to create and auto-connect.
 */
export function QuickAddMenu({ screenPos, onSelect, onClose }: QuickAddMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click or Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown, { capture: true })
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown, { capture: true })
    }
  }, [onClose])

  // Clamp to viewport so the menu never overflows off-screen
  const menuWidth = 200
  const menuHeight = BLOCK_OPTIONS.length * 52 + 12
  const left = Math.min(screenPos.x + 12, window.innerWidth  - menuWidth  - 8)
  const top  = Math.min(screenPos.y - 8,  window.innerHeight - menuHeight - 8)

  return (
    <div
      ref={menuRef}
      className="quick-add-menu"
      role="menu"
      aria-label="Add connected node"
      style={{ left, top }}
    >
      <p className="quick-add-menu__heading">Add node</p>
      {BLOCK_OPTIONS.map((opt) => (
        <button
          key={opt.type}
          className="quick-add-menu__item"
          role="menuitem"
          onClick={() => onSelect(opt.type)}
        >
          <span className="quick-add-menu__icon" aria-hidden="true">{opt.icon}</span>
          <span className="quick-add-menu__text">
            <span className="quick-add-menu__label">{opt.label}</span>
            <span className="quick-add-menu__desc">{opt.description}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
