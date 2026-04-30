import { X } from "lucide-react";
import { useToastStore } from "@/store/toastStore";
import { cn } from "@/lib/utils";

/**
 * Toast-container. Stackt nieuwe berichten onderin rechts zodat de
 * belangrijkste melding (de nieuwste) direct bij de muis staat. Klik op
 * het kruisje of de actie-knop sluit de toast.
 */
export function Toasts() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex min-w-[260px] max-w-[420px] items-start gap-2 rounded-md border px-3 py-2 shadow-md",
            "animate-slideIn",
            kindStyle(t.kind),
          )}
          role="status"
        >
          <p className="flex-1 text-sm leading-snug">{t.message}</p>
          {(t.actions ?? (t.action ? [t.action] : [])).map((a, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                a.onClick();
                dismiss(t.id);
              }}
              className="rounded px-2 py-0.5 text-xs font-medium underline underline-offset-2 hover:opacity-80"
            >
              {a.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="rounded p-0.5 opacity-70 hover:opacity-100"
            title="Sluiten"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function kindStyle(kind: string): string {
  switch (kind) {
    case "success":
      return "border-[var(--claude-success)] bg-[var(--claude-bg)] text-[var(--claude-text-primary)]";
    case "warning":
      return "border-[var(--claude-warning)] bg-[var(--claude-bg)] text-[var(--claude-text-primary)]";
    case "error":
      return "border-[var(--claude-error)] bg-[var(--claude-bg)] text-[var(--claude-text-primary)]";
    default:
      return "border-[var(--claude-border)] bg-[var(--claude-surface)] text-[var(--claude-text-primary)]";
  }
}
