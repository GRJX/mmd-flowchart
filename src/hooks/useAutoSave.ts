import { useEffect, useRef } from "react";
import { useDiagramStore } from "@/store/diagramStore";
import { useFolderStore } from "@/store/folderStore";
import { saveCurrentDiagram } from "@/lib/fs/fileOps";
import { AUTOSAVE_DEBOUNCE_MS } from "@/types/domain";

/**
 * Debounced auto-save: 2 seconds after the last diagram mutation, the
 * current file is written back to disk (FO §5).
 *
 * We subscribe to the diagram store itself rather than using `isDirty` as a
 * dependency — `isDirty` flips many times during editing and we want the
 * debounce to reset on every change, regardless of whether the flag was
 * already true.
 */
export function useAutoSave(): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<boolean>(false);

  useEffect(() => {
    const schedule = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        timeoutRef.current = null;
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
      }, AUTOSAVE_DEBOUNCE_MS);
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
