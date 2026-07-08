import { useEffect, useRef } from "react";
import { useDiagramStore } from "@/store/diagramStore";
import { useFolderStore } from "@/store/folderStore";
import { saveCurrentDiagram } from "@/lib/fs/fileOps";
import { isVsCodeWebview, pushDocumentEdit } from "@/lib/vscode/bridge";
import { AUTOSAVE_DEBOUNCE_MS } from "@/types/domain";

/**
 * Debounced auto-save: after the last diagram mutation, the current file is
 * written back to disk (FO §5).
 *
 * In VSCode the target is the TextDocument buffer instead of disk — VSCode
 * itself decides when to persist (auto-save settings, Ctrl+S). Buffer syncs
 * are cheap, so the debounce is much shorter there.
 *
 * We subscribe to the diagram store itself rather than using `isDirty` as a
 * dependency — `isDirty` flips many times during editing and we want the
 * debounce to reset on every change, regardless of whether the flag was
 * already true.
 */

const VSCODE_SYNC_DEBOUNCE_MS = 250;

export function useAutoSave(): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<boolean>(false);

  useEffect(() => {
    const vscodeMode = isVsCodeWebview();
    const delay = vscodeMode ? VSCODE_SYNC_DEBOUNCE_MS : AUTOSAVE_DEBOUNCE_MS;

    const schedule = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        timeoutRef.current = null;
        if (vscodeMode) {
          pushDocumentEdit();
          return;
        }
        const { isDirty, readOnlyReason } = useDiagramStore.getState();
        const { currentFilePath, root } = useFolderStore.getState();
        if (!isDirty || readOnlyReason || !currentFilePath || !root) return;
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        try {
          await saveCurrentDiagram();
        } finally {
          inFlightRef.current = false;
        }
      }, delay);
    };

    const unsub = useDiagramStore.subscribe((state, prev) => {
      if (state.diagram === prev.diagram) return;
      if (!state.isDirty) return;
      schedule();
    });

    return () => {
      unsub();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
}
