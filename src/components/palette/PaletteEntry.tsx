import type { BlockType } from '../../types/diagram'
import {
  StartPreview,
  EndPreview,
  ActionPreview,
  DecisionPreview,
  ResultPreview,
} from './previews/BlockPreviews'

interface PaletteEntryProps {
  type: BlockType
  label: string
  disabled?: boolean
  onDragStart: (e: React.DragEvent, type: BlockType) => void
  onClick: (type: BlockType) => void
}

const PREVIEWS: Record<BlockType, React.ComponentType> = {
  start: StartPreview,
  end: EndPreview,
  action: ActionPreview,
  decision: DecisionPreview,
  result: ResultPreview,
}

export function PaletteEntry({ type, label, disabled, onDragStart, onClick }: PaletteEntryProps) {
  const Preview = PREVIEWS[type]

  return (
    <div
      className={`palette-entry ${disabled ? 'palette-entry--disabled' : ''}`}
      draggable={!disabled}
      onDragStart={disabled ? undefined : (e) => onDragStart(e, type)}
      onClick={disabled ? undefined : () => onClick(type)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Add ${label} block`}
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick(type)
        }
      }}
    >
      <div className="palette-preview">
        <Preview />
      </div>
      <span className="palette-label">{label}</span>
    </div>
  )
}
