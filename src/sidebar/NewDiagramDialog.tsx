import { useEffect, useRef, useState } from "react";
import { createNewDiagram } from "@/lib/fs/fileOps";
import { useFolderStore } from "@/store/folderStore";
import { cn } from "@/lib/utils";

/**
 * Lightweight modal for "New diagram". The target folder comes from the
 * folder store, so both the toolbar button ("" = root) and the sidebar
 * context-menu ("nieuwe diagram hier" = that folder) share one dialog.
 */

export function NewDiagramDialog() {
  const open = useFolderStore((s) => s.newDiagramDialogOpen);
  const targetFolder = useFolderStore((s) => s.newDiagramTargetFolder);
  const close = useFolderStore((s) => s.closeNewDiagramDialog);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setError(null);
    setBusy(false);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await createNewDiagram({ name, folderPath: targetFolder });
    setBusy(false);
    if (res.ok) {
      close();
      return;
    }
    switch (res.reason) {
      case "invalid-name":
        setError(
          "Ongeldige naam. Geen schuine strepen en niet met een punt beginnen.",
        );
        break;
      case "exists":
        setError("Er bestaat al een bestand met deze naam.");
        break;
      case "write-failed":
        setError("Het bestand kon niet worden aangemaakt.");
        break;
      case "no-root":
        setError("Open eerst een map.");
        break;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={close}
    >
      <div
        className="w-[380px] rounded-lg border border-[var(--claude-border)] bg-[var(--claude-surface)] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-[var(--claude-text-primary)]">
          Nieuw diagram
        </h2>
        <p className="mt-1 text-xs text-[var(--claude-text-secondary)]">
          Wordt aangemaakt in{" "}
          <span className="font-mono">{targetFolder || "/"}</span>.
        </p>
        <input
          ref={inputRef}
          type="text"
          value={name}
          placeholder="mijn-diagram.mmd"
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void submit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              close();
            }
          }}
          className="mt-3 w-full rounded border border-[var(--claude-border)] bg-[var(--claude-bg)] px-2 py-1.5 text-sm text-[var(--claude-text-primary)] outline-none focus:border-[var(--claude-accent)]"
        />
        {error && (
          <p className="mt-2 text-xs text-[var(--claude-accent)]">{error}</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="rounded-md border border-[var(--claude-border)] bg-[var(--claude-bg)] px-3 py-1.5 text-xs text-[var(--claude-text-secondary)] hover:bg-[var(--claude-surface-hover)]"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || !name.trim()}
            className={cn(
              "rounded-md bg-[var(--claude-accent)] px-3 py-1.5 text-xs font-medium text-white shadow-sm",
              busy || !name.trim()
                ? "cursor-not-allowed opacity-60"
                : "hover:opacity-90",
            )}
          >
            {busy ? "Bezig…" : "Aanmaken"}
          </button>
        </div>
      </div>
    </div>
  );
}
