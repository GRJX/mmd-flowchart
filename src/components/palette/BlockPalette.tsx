import { useCallback } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
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

interface BlockPaletteProps {
  /** Called when the user drags a block type out to the canvas */
  onDragStart?: (e: React.DragEvent, type: BlockType) => void
  /** Called when the user clicks a block type to add it to canvas center */
  onClickAdd?: (type: BlockType) => void
}

export function BlockPalette({ onDragStart, onClickAdd }: BlockPaletteProps) {
  const { selection, diagram } = useAppStore()

  // Determine which block type is selected (for properties header)
  const selectedIds = Array.from(selection)
  const firstSelectedBlock =
    selectedIds.length === 1 ? diagram?.blocks.get(selectedIds[0]) : null

  const hasStart = diagram
    ? Array.from(diagram.blocks.values()).some((b) => b.type === 'start')
    : false

  const handleDragStart = useCallback(
    (e: React.DragEvent, type: BlockType) => {
      e.dataTransfer.setData('application/block-type', type)
      e.dataTransfer.effectAllowed = 'copy'
      onDragStart?.(e, type)
    },
    [onDragStart],
  )

  const handleClickAdd = useCallback(
    (type: BlockType) => {
      onClickAdd?.(type)
    },
    [onClickAdd],
  )

  const handleBackTopalette = useCallback(() => {
    useAppStore.getState().setSelection(new Set())
  }, [])

  // Properties mode: single block selected
  if (firstSelectedBlock) {
    const typeName = BLOCK_TYPE_LABELS[firstSelectedBlock.type]
    return (
      <div className="right-panel">
        <div className="panel-header panel-header--properties">
          <button
            className="panel-back-btn"
            onClick={handleBackTopalette}
            aria-label="Back to palette"
          >
            <ArrowLeft size={14} strokeWidth={2} />
          </button>
          <span className="panel-header-title">{typeName} Block</span>
        </div>
        <div className="panel-properties-placeholder">
          <span className="panel-properties-hint">
            Properties panel coming in Epic #6
          </span>
        </div>
      </div>
    )
  }

  // Palette mode (default)
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
