/**
 * useKeyboardShortcuts — global keyboard shortcut handler (§18)
 *
 * - Ctrl/Cmd+Z            → undo
 * - Ctrl/Cmd+Y            → redo
 * - Ctrl/Cmd+Shift+Z      → redo
 * - Arrow keys            → nudge selected block(s) by 8px
 * - Shift+Arrow keys      → nudge selected block(s) by 1px
 *
 * Arrow-key nudges are coalesced into a single undo entry within a 300 ms
 * window (handled inside nudgeSelectedBlocks in the store).
 *
 * Note: Ctrl+S is handled by useSave. Delete/Backspace is handled inside
 * DiagramCanvas (needs access to ReactFlow node state).
 */

import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";

/** Returns true when focus is inside a text input / textarea / contenteditable. */
function isTyping(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = (el as HTMLElement).tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

const NUDGE_LARGE = 8;
const NUDGE_SMALL = 1;

export function useKeyboardShortcuts() {
  const { undo, redo, nudgeSelectedBlocks } = useAppStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      // ── Undo: Ctrl/Cmd+Z ─────────────────────────────────────────────────
      if (mod && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        undo();
        return;
      }

      // ── Redo: Ctrl/Cmd+Y ─────────────────────────────────────────────────
      if (mod && !e.shiftKey && e.key === "y") {
        e.preventDefault();
        redo();
        return;
      }

      // ── Redo: Ctrl/Cmd+Shift+Z ───────────────────────────────────────────
      if (mod && e.shiftKey && e.key === "z") {
        e.preventDefault();
        redo();
        return;
      }

      // ── Arrow nudge — only when blocks are selected, not while typing ─────
      if (isTyping()) return;

      const step = e.shiftKey ? NUDGE_SMALL : NUDGE_LARGE;
      const { selection } = useAppStore.getState();
      if (selection.size === 0) return;

      let dx = 0;
      let dy = 0;

      switch (e.key) {
        case "ArrowLeft":
          dx = -step;
          break;
        case "ArrowRight":
          dx = step;
          break;
        case "ArrowUp":
          dy = -step;
          break;
        case "ArrowDown":
          dy = step;
          break;
        default:
          return;
      }

      e.preventDefault(); // prevent ReactFlow / browser scrolling
      nudgeSelectedBlocks(dx, dy);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, nudgeSelectedBlocks]);
}
