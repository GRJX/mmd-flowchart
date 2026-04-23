import { useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Kleine bevestigingsdialoog voor destructieve acties (bv. verwijderen).
 * Enter bevestigt, Escape annuleert.
 */
interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Bevestigen",
  cancelLabel = "Annuleren",
  danger,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      else if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, onConfirm]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-[360px] rounded-lg border border-[var(--claude-border)] bg-[var(--claude-surface)] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-[var(--claude-text-primary)]">
          {title}
        </h2>
        <p className="mt-1 whitespace-pre-wrap break-words text-xs text-[var(--claude-text-secondary)]">
          {message}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-[var(--claude-border)] bg-[var(--claude-bg)] px-3 py-1.5 text-xs text-[var(--claude-text-secondary)] hover:bg-[var(--claude-surface-hover)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:opacity-90",
              danger
                ? "bg-[var(--claude-error)]"
                : "bg-[var(--claude-accent)]",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
