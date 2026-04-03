import { useAppStore } from '../../store/useAppStore'
import type { Block } from '../../types/diagram'
import { AlertTriangle } from 'lucide-react'

const BLOCK_TYPE_LABELS: Record<string, string> = {
  start: 'Start',
  end: 'End',
  action: 'Action',
  decision: 'Decision',
  result: 'Result',
}

interface BlockPropertiesProps {
  block: Block
}

export function BlockProperties({ block }: BlockPropertiesProps) {
  const {
    diagram,
    updateBlockLabel,
    updateBlockDataField,
    updateBlockExpectedOutcome,
    openCommentPanel,
  } = useAppStore()

  // Decision block: resolve Y / N connection targets from store
  let yTargetLabel: string | null = null
  let nTargetLabel: string | null = null
  if (block.type === 'decision' && diagram) {
    for (const conn of diagram.connections.values()) {
      if (conn.sourceId !== block.id) continue
      const targetLabel = diagram.blocks.get(conn.targetId)?.label ?? conn.targetId
      if (conn.type === 'yes') yTargetLabel = targetLabel
      if (conn.type === 'no') nTargetLabel = targetLabel
    }
  }
  const decisionIncomplete = block.type === 'decision' && (!yTargetLabel || !nTargetLabel)

  const commentCount = block.comments.length

  // Label for the description field (Decision shows "Condition")
  const descLabel = block.type === 'decision' ? 'Condition' : 'Description'

  return (
    <div className="block-properties">
      {/* Block Type — read-only */}
      <div className="prop-row">
        <span className="prop-label">Type</span>
        <span className="prop-value prop-value--readonly">
          {BLOCK_TYPE_LABELS[block.type]} Block
        </span>
      </div>

      {/* ID — read-only */}
      <div className="prop-row">
        <span className="prop-label">ID</span>
        <span className="prop-value prop-value--readonly prop-value--mono">{block.id}</span>
      </div>

      {/* Description / Condition */}
      <div className="prop-row prop-row--column">
        <span className="prop-label">{descLabel}</span>
        {block.type === 'start' ? (
          <span className="prop-value prop-value--readonly">Start</span>
        ) : (
          <input
            className="prop-input"
            value={block.label}
            onChange={(e) => updateBlockLabel(block.id, e.target.value)}
            placeholder={`${descLabel}…`}
          />
        )}
      </div>

      {/* Action: Data Field */}
      {block.type === 'action' && (
        <div className="prop-row prop-row--column">
          <span className="prop-label">Data Field</span>
          <textarea
            className="prop-textarea"
            value={block.dataField ?? ''}
            onChange={(e) =>
              updateBlockDataField(block.id, e.target.value || null)
            }
            placeholder="Test data, preconditions…"
            rows={3}
          />
        </div>
      )}

      {/* Decision: Y / N path targets + incomplete warning */}
      {block.type === 'decision' && (
        <>
          {decisionIncomplete && (
            <div className="prop-incomplete-warning">
              <AlertTriangle size={12} />
              <span>
                Missing {!yTargetLabel && !nTargetLabel
                  ? 'Y and N paths'
                  : !yTargetLabel
                  ? 'Y path'
                  : 'N path'}
              </span>
            </div>
          )}
          <div className="prop-row">
            <span className="prop-label">Y Path</span>
            <span
              className={`prop-value prop-value--readonly ${!yTargetLabel ? 'prop-value--missing' : ''}`}
            >
              {yTargetLabel ?? '—'}
            </span>
          </div>
          <div className="prop-row">
            <span className="prop-label">N Path</span>
            <span
              className={`prop-value prop-value--readonly ${!nTargetLabel ? 'prop-value--missing' : ''}`}
            >
              {nTargetLabel ?? '—'}
            </span>
          </div>
        </>
      )}

      {/* Result: Expected Outcome */}
      {block.type === 'result' && (
        <div className="prop-row prop-row--column">
          <span className="prop-label">Expected Outcome</span>
          <textarea
            className="prop-textarea"
            value={block.expectedOutcome ?? ''}
            onChange={(e) =>
              updateBlockExpectedOutcome(block.id, e.target.value || null)
            }
            placeholder="Expected test result…"
            rows={3}
          />
        </div>
      )}

      {/* Comments */}
      <div className="prop-row">
        <span className="prop-label">Comments</span>
        <button
          className={`prop-comments-btn ${commentCount > 0 ? 'prop-comments-btn--has' : ''}`}
          onClick={() => openCommentPanel(block.id)}
        >
          {commentCount === 0
            ? 'No comments'
            : `${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
