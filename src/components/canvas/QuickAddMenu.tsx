import { useEffect, useRef } from 'react'
import type { BlockType } from '../../types/diagram'

// ── Fan item definitions ──────────────────────────────────────────────────────

interface FanItem {
  type: BlockType
  label: string
  /** Pixel offset from the + button center to the item button center. */
  dx: number
  dy: number
}

/**
 * Four items spread in a downward arc (radius 72px), symmetric around the
 * vertical axis below the + button:
 *   Decision  150° → lower-left
 *   Action    120° → center-left (most common next step, near center)
 *   Result     60° → center-right
 *   End        30° → lower-right
 */
const FAN_ITEMS: FanItem[] = [
  { type: 'decision', label: 'Decision', dx: -75, dy: 40 },
  { type: 'action',   label: 'Action',   dx: -25, dy: 40 },
  { type: 'result',   label: 'Result',   dx: +25, dy: 40 },
  { type: 'end',      label: 'End',      dx: +75, dy: 40 },
]

const BTN_SIZE = 44 // px — size of each fan button

// ── Mini block-shape icons ────────────────────────────────────────────────────

function FanIcon({ type }: { type: BlockType }) {
  switch (type) {
    case 'action':
      return <div className="fan-icon fan-icon--action" aria-hidden />
    case 'decision':
      return (
        <div className="fan-icon fan-icon--decision-wrap" aria-hidden>
          <div className="fan-icon fan-icon--decision-fill" />
        </div>
      )
    case 'result':
      return <div className="fan-icon fan-icon--result" aria-hidden />
    case 'end':
      return <div className="fan-icon fan-icon--end" aria-hidden />
    default:
      return null
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface QuickAddMenuProps {
  screenPos: { x: number; y: number }
  onSelect: (type: BlockType) => void
  onClose: () => void
}

/**
 * Radial fan node-type picker.
 * Anchored at the clicked (+) button position; items fan outward in a downward
 * arc. Each item shows a mini shape matching the actual block type.
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

  return (
    <div
      ref={menuRef}
      className="radial-menu"
      role="menu"
      aria-label="Add connected node"
      style={{ left: screenPos.x, top: screenPos.y }}
    >
      {FAN_ITEMS.map((item, i) => (
        <div
          key={item.type}
          className="radial-item"
          style={{
            left: item.dx - BTN_SIZE / 2,
            top: item.dy - BTN_SIZE / 2,
            animationDelay: `${i * 25}ms`,
          }}
        >
          <button
            className="radial-item__btn"
            role="menuitem"
            onClick={() => onSelect(item.type)}
            title={item.label}
            aria-label={`Add ${item.label}`}
            type="button"
          >
            <FanIcon type={item.type} />
          </button>
          <span className="radial-item__label" aria-hidden>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
