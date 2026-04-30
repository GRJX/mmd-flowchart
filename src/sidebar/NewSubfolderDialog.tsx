import { useEffect, useRef, useState } from "react";
import { createSubfolder } from "@/lib/fs/fileOps";
import { cn } from "@/lib/utils";

interface Props {
  parentPath: string;
  onClose: () => void;
}

export function NewSubfolderDialog({ parentPath, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, []);

  const submit = async () => {
    if (busy || !name.trim()) return;
    setBusy(true);
    setError(null);
    const res = await createSubfolder(parentPath, name);
    setBusy(false);
    if (res.ok) onClose();
    else setError("Kon de map niet aanmaken.");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-[360px] rounded-lg border border-[var(--claude-border)] bg-[var(--claude-surface)] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-[var(--claude-text-primary)]">
          Nieuwe map
        </h2>
        <p className="mt-1 text-xs text-[var(--claude-text-secondary)]">
          Wordt aangemaakt in{" "}
          <span className="font-mono">{parentPath || "/"}</span>.
        </p>
        <input
          ref={inputRef}
          type="text"
          value={name}
          placeholder="naam"
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
              onClose();
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
            onClick={onClose}
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
