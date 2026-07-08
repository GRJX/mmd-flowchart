import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { useDiagramStore } from "@/store/diagramStore";
import { saveCurrentDiagram } from "@/lib/fs/fileOps";
import { isEmbeddedHost, requestDocumentSave } from "@/lib/host/bridge";

/**
 * Global keyboard shortcuts (FO §11). Attached once from App. Shortcuts are
 * ignored when focus is inside an input/textarea/contentEditable element so
 * typing in the right panel or inline labels keeps working normally.
 */

const FIT_PADDING = 0.2;
const FIT_DURATION_MS = 200;

function inInput(el: EventTarget | null): boolean {
  const t = el as HTMLElement | null;
  if (!t) return false;
  if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") {
    return true;
  }
  return t.isContentEditable;
}

export function useShortcuts() {
  const flow = useReactFlow();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const key = e.key.toLowerCase();

      if (key === "s" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        // When embedded, the host IDE saves the document; forward the
        // intent instead of writing to disk ourselves.
        if (isEmbeddedHost()) requestDocumentSave();
        else void saveCurrentDiagram();
        return;
      }
      if (inInput(e.target)) return;

      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        useDiagramStore.getState().undo();
      } else if ((key === "z" && e.shiftKey) || (key === "y" && !e.shiftKey)) {
        e.preventDefault();
        useDiagramStore.getState().redo();
      } else if (key === "a") {
        e.preventDefault();
        useDiagramStore.getState().selectAll();
      } else if (key === "d" && !e.shiftKey && !e.altKey) {
        const { selection, duplicateBlocks, readOnlyReason } = useDiagramStore.getState();
        if (readOnlyReason || selection.blockIds.length === 0) return;
        e.preventDefault();
        duplicateBlocks(selection.blockIds);
      } else if (key === "c" && !e.shiftKey && !e.altKey) {
        const { selection } = useDiagramStore.getState();
        if (selection.blockIds.length === 0) return;
        e.preventDefault();
        useDiagramStore.getState().copySelection();
      } else if (key === "v" && !e.shiftKey && !e.altKey) {
        const { clipboard, readOnlyReason } = useDiagramStore.getState();
        if (readOnlyReason || !clipboard) return;
        e.preventDefault();
        useDiagramStore.getState().paste();
      } else if (key === "f" && e.shiftKey) {
        e.preventDefault();
        void flow.fitView({ padding: FIT_PADDING, duration: FIT_DURATION_MS });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flow]);
}
