import { useCallback } from 'react'
import { Trash2, ArrowLeftRight } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import type { Connection, DiagramFile } from '../../types/diagram'

interface ConnectionPropertiesProps {
  connection: Connection
  diagram: DiagramFile
}

const TYPE_LABELS = { yes: 'Y (Yes)', no: 'N (No)', default: 'Default' }

export function ConnectionProperties({ connection, diagram }: ConnectionPropertiesProps) {
  const { updateConnectionType, deleteConnection, setSelectedConnectionId } = useAppStore()

  const sourceBlock = diagram.blocks.get(connection.sourceId)
  const targetBlock = diagram.blocks.get(connection.targetId)
  const isDecisionConn = sourceBlock?.type === 'decision'

  const handleDelete = useCallback(() => {
    deleteConnection(connection.id)
    setSelectedConnectionId(null)
  }, [connection.id, deleteConnection, setSelectedConnectionId])

  const handleSwapYN = useCallback(() => {
    const next = connection.type === 'yes' ? 'no' : 'yes'
    updateConnectionType(connection.id, next)
  }, [connection.id, connection.type, updateConnectionType])

  return (
    <div className="block-properties">
      {/* Type */}
      <div className="prop-row">
        <span className="prop-label">Type</span>
        {isDecisionConn ? (
          <select
            className="prop-select"
            value={connection.type}
            onChange={(e) =>
              updateConnectionType(
                connection.id,
                e.target.value as 'yes' | 'no' | 'default',
              )
            }
          >
            <option value="yes">Y (Yes)</option>
            <option value="no">N (No)</option>
            <option value="default">Default</option>
          </select>
        ) : (
          <span className="prop-value prop-value--readonly">
            {TYPE_LABELS[connection.type]}
          </span>
        )}
      </div>

      {/* From */}
      <div className="prop-row">
        <span className="prop-label">From</span>
        <span className="prop-value prop-value--readonly prop-value--mono">
          {connection.sourceId}
          {sourceBlock ? ` · ${sourceBlock.label}` : ''}
        </span>
      </div>

      {/* To */}
      <div className="prop-row">
        <span className="prop-label">To</span>
        <span className="prop-value prop-value--readonly prop-value--mono">
          {connection.targetId}
          {targetBlock ? ` · ${targetBlock.label}` : ''}
        </span>
      </div>

      {/* Actions */}
      <div className="prop-actions">
        {isDecisionConn &&
          (connection.type === 'yes' || connection.type === 'no') && (
            <button
              className="prop-action-btn prop-action-btn--secondary"
              onClick={handleSwapYN}
            >
              <ArrowLeftRight size={12} />
              Swap Y / N
            </button>
          )}
        <button
          className="prop-action-btn prop-action-btn--danger"
          onClick={handleDelete}
        >
          <Trash2 size={12} />
          Delete Connection
        </button>
      </div>
    </div>
  )
}
