import { useEffect, useCallback, useRef } from "react";
import { useAppStore } from "../store/useAppStore";
import { writeFileAtomic, getFileLastModified } from "../lib/fileSystem";

/** Debounce delay (ms) before auto-save fires after the last change. */
const AUTO_SAVE_DELAY = 2000;

/**
 * useSave — Ctrl/Cmd+S manual save + 2-second debounced auto-save.
 *
 * - Atomic write pattern (§9.3)
 * - External-change detection (manual save only)
 * - beforeunload guard when isDirty
 * - Auto-save silently fires AUTO_SAVE_DELAY ms after the last dirty change
 */
export function useSave(serialize: (() => string) | null) {
  const { diagram, addToast } = useAppStore();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Core write helper (shared by manual + auto save) ──────────────────────
  const writeNow = useCallback(
    async (opts: {
      checkExternalChanges: boolean;
    }): Promise<"ok" | "reload" | "error"> => {
      if (!diagram || !serialize) return "error";

      let content: string;
      try {
        content = serialize();
      } catch (err) {
        addToast(err instanceof Error ? err.message : "Save failed.", "error");
        return "error";
      }

      try {
        if (opts.checkExternalChanges && diagram.lastSavedAt) {
          const lastModified = await getFileLastModified(diagram.fileHandle);
          if (lastModified > diagram.lastSavedAt.getTime()) {
            const overwrite = window.confirm(
              "This file has been modified on disk. Overwrite with your changes, or discard and reload?",
            );
            if (!overwrite) return "reload";
          }
        }

        await writeFileAtomic(diagram.fileHandle, content);

        useAppStore.getState().setDiagramDirty(false);
        useAppStore.setState((s) =>
          s.diagram
            ? { diagram: { ...s.diagram, lastSavedAt: new Date() } }
            : {},
        );
        return "ok";
      } catch (err) {
        addToast("Save failed. Your file was not changed.", "error");
        console.error(err);
        return "error";
      }
    },
    [diagram, serialize, addToast],
  );

  // ── Manual save (Ctrl/Cmd+S) — checks for external changes ───────────────
  const save = useCallback(async () => {
    // Cancel any pending auto-save since we're saving now
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
    return writeNow({ checkExternalChanges: true });
  }, [writeNow]);

  // ── Auto-save — debounced, silent, no external-change prompt ─────────────
  useEffect(() => {
    if (!diagram?.isDirty || !serialize) return;

    // Each time isDirty flips to true (or serialize ref changes), reset timer
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      autoSaveTimer.current = null;
      writeNow({ checkExternalChanges: false });
    }, AUTO_SAVE_DELAY);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
  }, [diagram?.isDirty, diagram, serialize, writeNow]);

  // ── beforeunload guard ─────────────────────────────────────────────────────
  useEffect(() => {
    const isDirty = diagram?.isDirty ?? false;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }

    if (isDirty) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [diagram?.isDirty]);

  // ── Keyboard shortcut ──────────────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [save]);

  return { save };
}
