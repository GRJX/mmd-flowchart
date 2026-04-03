import { expect } from "@playwright/test";
import { ToolbarPage } from "../pages/toolbar.page";

/**
 * Assert that both Undo and Redo toolbar buttons are in the disabled /
 * idle state expected when neither stack has any entries.
 * Used to verify the post-no-op state after firing keyboard shortcuts
 * with an empty undo/redo history.
 */
export async function assertUndoRedoIdleState(
  tb: ToolbarPage,
): Promise<void> {
  await expect(tb.undo).toBeDisabled();
  await expect(tb.redo).toBeDisabled();
}

/**
 * Assert the keyboard-shortcut hint embedded in the Undo button's title
 * attribute.
 */
export async function assertUndoButtonAttributes(
  tb: ToolbarPage,
): Promise<void> {
  await expect(tb.undo).toHaveAttribute("aria-label", "Undo");
  const title = await tb.undo.getAttribute("title");
  expect(title, "Undo title should mention Ctrl+Z shortcut").toContain(
    "Ctrl+Z",
  );
}

/**
 * Assert the keyboard-shortcut hint embedded in the Redo button's title
 * attribute.
 */
export async function assertRedoButtonAttributes(
  tb: ToolbarPage,
): Promise<void> {
  await expect(tb.redo).toHaveAttribute("aria-label", "Redo");
  const title = await tb.redo.getAttribute("title");
  expect(title, "Redo title should mention Ctrl+Y shortcut").toContain(
    "Ctrl+Y",
  );
}
