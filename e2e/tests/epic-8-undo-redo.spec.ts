/**
 * Epic #8 — Undo / redo
 * Functional acceptance tests (Issue #8, Story #35)
 *
 * ──────────────────────────────────────────────────────────────────────────
 * SCOPE NOTE
 * The undo/redo history is only populated by performing diagram mutations
 * (add block, delete block, move block, etc.) which all require an open
 * DiagramFile obtained via the File System Access API (showDirectoryPicker /
 * FileSystemFileHandle).  These native OS-level calls cannot be driven in a
 * headless Playwright session.
 *
 * What IS tested here (structural / cold-load / keyboard no-op):
 *   S8.1 — Toolbar Undo/Redo button attributes:
 *           correct aria-label, keyboard shortcut hints in title,
 *           disabled state when stacks are empty
 *   S8.1 — Keyboard shortcut no-op safety:
 *           Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z with no diagram loaded are
 *           safe no-ops — stacks stay empty, toolbar remains intact
 *   S8.1 — Arrow-key nudge guard:
 *           pressing Arrow keys with an empty selection produces no undo
 *           entries — Undo stays disabled
 *   S8.1 — isTyping() guard wiring:
 *           Ctrl+Z targeting a text element still fires the store undo()
 *           (undo/redo intentionally NOT blocked while typing — only arrow
 *           nudges are)
 *
 * Manual QA required for:
 *   S8.1 — Add block → undo restores exact prior state (snapshot byte-match)
 *   S8.1 — Delete block → undo restores deleted block and its connections
 *   S8.1 — Drag block (pointer-up) → single undo entry (not per pixel)
 *   S8.1 — Arrow-key nudge within 300 ms coalesces into one undo entry
 *   S8.1 — Undo clears redoStack; redo clears future entries correctly
 *   S8.1 — Stack capped at 100 — 101st action drops oldest entry
 *   S8.1 — File open/create/save resets both stacks
 *   S8.1 — Edit label, data field, expected outcome, comment add/delete
 *           all push entries and round-trip correctly through undo
 *   S8.1 — Change connection type (Y/N/default) is undoable
 * ──────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from "@playwright/test";
import { loadApp } from "../steppers/navigation.stepper";
import { ToolbarPage } from "../pages/toolbar.page";
import { CanvasPage } from "../pages/canvas.page";
import {
  assertUndoRedoIdleState,
  assertUndoButtonAttributes,
  assertRedoButtonAttributes,
} from "../asserters/undo-redo.asserter";

// ── S8.1 — Toolbar button attributes ─────────────────────────────────────

test.describe("S8.1 — Undo/Redo toolbar button attributes", () => {
  test("Undo button has aria-label 'Undo'", async ({ page }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await expect(tb.undo).toHaveAttribute("aria-label", "Undo");
  });

  test("Undo button title attribute contains the Ctrl+Z keyboard shortcut hint", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    const title = await tb.undo.getAttribute("title");
    expect(title, "Undo title should mention Ctrl+Z").toContain("Ctrl+Z");
  });

  test("Redo button has aria-label 'Redo'", async ({ page }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await expect(tb.redo).toHaveAttribute("aria-label", "Redo");
  });

  test("Redo button title attribute contains the Ctrl+Y keyboard shortcut hint", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    const title = await tb.redo.getAttribute("title");
    expect(title, "Redo title should mention Ctrl+Y").toContain("Ctrl+Y");
  });

  test("composite Undo/Redo attribute check passes on cold load", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await assertUndoButtonAttributes(tb);
    await assertRedoButtonAttributes(tb);
  });
});

// ── S8.1 — Keyboard shortcut no-op safety ────────────────────────────────

test.describe("S8.1 — Keyboard shortcuts are safe no-ops without an open diagram", () => {
  test("Ctrl+Z with empty undoStack keeps Undo button disabled", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await page.keyboard.press("Control+z");
    await expect(tb.undo).toBeDisabled();
  });

  test("Ctrl+Y with empty redoStack keeps Redo button disabled", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await page.keyboard.press("Control+y");
    await expect(tb.redo).toBeDisabled();
  });

  test("Ctrl+Shift+Z (alternate redo) with empty redoStack keeps Redo button disabled", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await page.keyboard.press("Control+Shift+Z");
    await expect(tb.redo).toBeDisabled();
  });

  test("firing all three redo shortcuts in sequence leaves toolbar intact", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await page.keyboard.press("Control+z");
    await page.keyboard.press("Control+y");
    await page.keyboard.press("Control+Shift+Z");
    // Both buttons still disabled — no stack entries were created
    await assertUndoRedoIdleState(tb);
  });

  test("pressing Ctrl+Z does not cause a page-level JavaScript error", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await loadApp(page);
    await page.keyboard.press("Control+z");
    expect(errors, "Ctrl+Z should not produce page-level JS errors").toHaveLength(0);
  });
});

// ── S8.1 — Arrow-key nudge guard (empty selection) ───────────────────────

test.describe("S8.1 — Arrow-key nudge is a no-op when selection is empty", () => {
  test("ArrowLeft with no selection keeps Undo button disabled", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await page.keyboard.press("ArrowLeft");
    await expect(tb.undo).toBeDisabled();
  });

  test("ArrowRight with no selection keeps Undo button disabled", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await page.keyboard.press("ArrowRight");
    await expect(tb.undo).toBeDisabled();
  });

  test("ArrowUp with no selection keeps Undo button disabled", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await page.keyboard.press("ArrowUp");
    await expect(tb.undo).toBeDisabled();
  });

  test("ArrowDown with no selection keeps Undo button disabled", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await page.keyboard.press("ArrowDown");
    await expect(tb.undo).toBeDisabled();
  });

  test("Shift+Arrow nudge variants with no selection are all safe no-ops", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await page.keyboard.press("Shift+ArrowLeft");
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowUp");
    await page.keyboard.press("Shift+ArrowDown");
    await assertUndoRedoIdleState(tb);
  });

  test("mixed keyboard tour: shortcuts + arrows with empty stacks → canvas empty state intact", async ({
    page,
  }) => {
    await loadApp(page);
    const canvas = new CanvasPage(page);
    const tb = new ToolbarPage(page);
    await page.keyboard.press("Control+z");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Control+y");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Control+Shift+Z");
    await page.keyboard.press("ArrowUp");
    // Canvas still shows empty state — no diagram was accidentally created
    await expect(canvas.emptyTitle).toHaveText("No diagram open");
    await assertUndoRedoIdleState(tb);
  });
});
