import { useState, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

interface CommentPanelProps {
  blockId: string
}

export function CommentPanel({ blockId }: CommentPanelProps) {
  const { diagram, addComment, deleteComment } = useAppStore()
  const block = diagram?.blocks.get(blockId)
  const [draft, setDraft] = useState('')

  const handleAdd = useCallback(() => {
    const trimmed = draft.trim()
    if (!trimmed) return
    addComment(blockId, trimmed)
    setDraft('')
  }, [blockId, addComment, draft])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleAdd()
      }
    },
    [handleAdd],
  )

  if (!block) return null

  return (
    <div className="comment-panel">
      <div className="comment-list">
        {block.comments.length === 0 && (
          <div className="comment-empty">No comments yet</div>
        )}
        {block.comments.map((comment) => (
          <div key={comment.id} className="comment-item">
            <div className="comment-item-header">
              <span className="comment-item-timestamp">
                {formatTimestamp(comment.timestamp)}
              </span>
              <button
                className="comment-item-delete"
                onClick={() => deleteComment(blockId, comment.id)}
                aria-label="Delete comment"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <p className="comment-item-text">{comment.text}</p>
          </div>
        ))}
      </div>

      <div className="comment-add">
        <textarea
          className="comment-add-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment… (Enter to submit)"
          maxLength={2000}
          rows={3}
        />
        <button
          className="comment-add-btn"
          onClick={handleAdd}
          disabled={!draft.trim()}
        >
          Add Comment
        </button>
      </div>
    </div>
  )
}
