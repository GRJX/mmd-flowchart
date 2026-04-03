import { X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export function Toast() {
  const { toasts, removeToast } = useAppStore()

  if (toasts.length === 0) return null

  return (
    <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.variant}`}
          role="alert"
        >
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-dismiss"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
          >
            <X size={13} strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  )
}
