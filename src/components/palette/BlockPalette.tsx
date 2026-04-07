import { useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { setDragBlockType } from '../../lib/dragState'
import type { BlockType } from '../../types/diagram'
import { PaletteEntry } from './PaletteEntry'

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  start: 'Start',
  end: 'End',
  action: 'Action',
  decision: 'Decision',
  result: 'Result',
}

const BLOCK_TYPE_ORDER: BlockType[] = ['start', 'action', 'decision', 'result', 'end']

/** Half-dimensions used to centre the drag ghost under the cursor. */
const GHOST_CENTER: Record<BlockType, [number, number]> = {
  start:    [36, 36],
  end:      [36, 36],
  action:   [60, 44],
  result:   [60, 44],
  decision: [60, 60],
}

/**
 * Builds a temporary off-screen DOM element that looks like the actual canvas
 * block. Appended to <body>, used as the drag-image, then removed.
 */
function createDragGhost(type: BlockType): HTMLElement {
  const cs = getComputedStyle(document.documentElement)
  const v  = (name: string) => cs.getPropertyValue(name).trim()

  // Outer wrapper — positioned off-screen so it's rendered but invisible
  const el = document.createElement('div')
  Object.assign(el.style, {
    position:    'fixed',
    top:         '-9999px',
    left:        '-9999px',
    pointerEvents: 'none',
    display:     'flex',
    alignItems:  'center',
    justifyContent: 'center',
    fontFamily:  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize:    '13px',
    fontWeight:  '500',
    color:       v('--text'),
    boxSizing:   'border-box',
    opacity:     '0.9',
  })

  const label = document.createElement('span')
  label.style.pointerEvents = 'none'

  switch (type) {
    case 'start':
    case 'end': {
      const border = v(type === 'start' ? '--teal' : '--red')
      const bg     = v(type === 'start' ? '--fill-start' : '--fill-end')
      Object.assign(el.style, {
        width: '72px', height: '72px',
        borderRadius: '50%',
        border: `2px solid ${border}`,
        background: bg,
      })
      label.textContent = type === 'start' ? 'Start' : 'End'
      el.appendChild(label)
      break
    }

    case 'action': {
      Object.assign(el.style, {
        width: '120px', height: '88px',
        borderRadius: '8px',
        border: `1.5px solid ${v('--border-hi')}`,
        background: v('--fill-action'),
      })
      label.textContent = 'Action'
      el.appendChild(label)
      break
    }

    case 'result': {
      Object.assign(el.style, {
        width: '120px', height: '88px',
        borderRadius: '8px',
        border: `1.5px solid ${v('--border-hi')}`,
        borderLeft: `4px solid ${v('--teal')}`,
        background: v('--fill-result'),
      })
      label.textContent = 'Result'
      el.appendChild(label)
      break
    }

    case 'decision': {
      Object.assign(el.style, {
        width: '120px', height: '120px',
        // relative so absolutely-positioned children are scoped to this el
        position: 'fixed',
      })
      const shape = document.createElement('div')
      Object.assign(shape.style, {
        position: 'absolute',
        inset: '6px',
        border: `2px solid ${v('--yellow')}`,
        borderRadius: '4px',
        background: v('--fill-decision'),
        transform: 'rotate(45deg)',
        boxSizing: 'border-box',
      })
      const content = document.createElement('div')
      Object.assign(content.style, {
        position: 'absolute',
        inset: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      })
      content.textContent = 'Condition?'
      el.appendChild(shape)
      el.appendChild(content)
      break
    }
  }

  return el
}

interface BlockPaletteProps {
  /** Called when the user drags a block type out to the canvas */
  onDragStart?: (e: React.DragEvent, type: BlockType) => void
  /** Called when the user clicks a block type to add it to canvas center */
  onClickAdd?: (type: BlockType) => void
}

export function BlockPalette({ onDragStart, onClickAdd }: BlockPaletteProps) {
  const { diagram } = useAppStore()

  const hasStart = diagram
    ? Array.from(diagram.blocks.values()).some((b) => b.type === 'start')
    : false

  const handleDragStart = useCallback(
    (e: React.DragEvent, type: BlockType) => {
      e.dataTransfer.setData('application/block-type', type)
      e.dataTransfer.effectAllowed = 'copy'
      setDragBlockType(type)

      // Attach a full-size block ghost as the drag image
      const ghost = createDragGhost(type)
      document.body.appendChild(ghost)
      const [cx, cy] = GHOST_CENTER[type]
      e.dataTransfer.setDragImage(ghost, cx, cy)
      // Remove after the browser has captured the image (next frame is enough)
      requestAnimationFrame(() => ghost.parentNode?.removeChild(ghost))

      onDragStart?.(e, type)
    },
    [onDragStart],
  )

  const handleClickAdd = useCallback(
    (type: BlockType) => { onClickAdd?.(type) },
    [onClickAdd],
  )

  return (
    <div className="right-panel">
      <div className="panel-header panel-header--palette">
        <span className="panel-header-label">Blocks</span>
      </div>
      <div className="palette-entries">
        {BLOCK_TYPE_ORDER.map((type) => (
          <PaletteEntry
            key={type}
            type={type}
            label={BLOCK_TYPE_LABELS[type]}
            disabled={type === 'start' && hasStart}
            onDragStart={handleDragStart}
            onClick={handleClickAdd}
          />
        ))}
      </div>
    </div>
  )
}

