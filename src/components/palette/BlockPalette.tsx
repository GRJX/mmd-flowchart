import { useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { setDragBlockType } from '../../lib/dragState'
import { BLOCK_CONFIG } from '../../lib/blockConfig'
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


/** Builds an off-screen drag-image element that visually matches the canvas block. */
function createDragGhost(type: BlockType): HTMLElement {
  const v = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const { width: gw, height: gh } = BLOCK_CONFIG[type].ghostDims

  const el = document.createElement('div')
  Object.assign(el.style, {
    position: 'fixed', top: '-9999px', left: '-9999px',
    pointerEvents: 'none', boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: '13px', fontWeight: '500', color: v('--text'),
  })

  if (type === 'start' || type === 'end') {
    Object.assign(el.style, {
      width: `${gw}px`, height: `${gh}px`, borderRadius: '50%',
      border: `2px solid ${v(type === 'start' ? '--teal' : '--red')}`,
      background: v(type === 'start' ? '--fill-start' : '--fill-end'),
    })
    el.textContent = type === 'start' ? 'Start' : 'End'
    return el
  }

  if (type === 'action' || type === 'result') {
    Object.assign(el.style, {
      width: `${gw}px`, height: `${gh}px`, borderRadius: '8px',
      border: `1.5px solid ${v('--border-hi')}`,
      ...(type === 'result' ? { borderLeft: `4px solid ${v('--teal')}` } : {}),
      background: v(type === 'action' ? '--fill-action' : '--fill-result'),
    })
    el.textContent = type === 'action' ? 'Action' : 'Result'
    return el
  }

  // decision — diamond shape via rotated child
  Object.assign(el.style, { width: `${gw}px`, height: `${gh}px`, position: 'fixed' })
  const shape = document.createElement('div')
  Object.assign(shape.style, {
    position: 'absolute', inset: '6px', boxSizing: 'border-box',
    border: `2px solid ${v('--yellow')}`, borderRadius: '4px',
    background: v('--fill-decision'), transform: 'rotate(45deg)',
  })
  const content = document.createElement('div')
  Object.assign(content.style, {
    position: 'absolute', inset: '0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  })
  content.textContent = 'Condition?'
  el.appendChild(shape)
  el.appendChild(content)
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
      const { width: gw, height: gh } = BLOCK_CONFIG[type].ghostDims
      e.dataTransfer.setDragImage(ghost, gw / 2, gh / 2)
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

