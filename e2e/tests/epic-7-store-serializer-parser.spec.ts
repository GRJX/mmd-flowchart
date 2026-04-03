/**
 * Epic #7 — Zustand store, serializer & Mermaid parser
 * Functional acceptance tests (Issue #7, Stories #31–#34)
 *
 * ──────────────────────────────────────────────────────────────────────────
 * SCOPE NOTE
 * The core deliverables of Epic #7 — round-trip serialize/parse, metadata
 * merge, toast warnings, integrity enforcement on save, and the >200-block
 * read-only fallback — all require a real open DiagramFile created via the
 * File System Access API (showDirectoryPicker / createMmdFile).  These native
 * OS-level calls cannot be driven in a headless Playwright session.
 *
 * What IS tested here (structural / cold-load):
 *   S7.1 — Store initializes with diagram: null and empty undo/redo stacks
 *   S7.2 — Serializer entry point: Save button wired, disabled without diagram
 *   S7.3 — Parser CSS: ReadOnlyPreview component styles bundled in stylesheet
 *   S7.4 — ReadOnlyPreview absent from DOM when no diagram is open
 *
 * Manual QA required for:
 *   S7.1 — setDiagram() resets undoStack/redoStack, isDirty flag behaviour
 *   S7.2 — Round-trip correctness: serializeDiagram() → .mmd format,
 *           %% MMD_META_START / JSON / %% MMD_META_END block present,
 *           node-ordering (start→action→decision→result→end),
 *           edge DFS ordering, label escaping (#34 special chars)
 *   S7.3 — parseMmd() merges MetadataV1 back into store, toast on bad JSON,
 *           toast on plain Mermaid ("Opened as Mermaid file. Metadata will
 *           be added on save."), read-only branch for non-flowchart type
 *   S7.4 — Integrity rules on save (orphaned-connection drop, duplicate
 *           Y/N drop, start-as-target and end-as-source drop), load integrity
 *           (>200 blocks → isReadOnly, non-flowchart → isReadOnly), banner
 *           text rendered inside ReadOnlyPreview, mermaid SVG rendered
 * ──────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from "@playwright/test";
import { loadApp } from "../steppers/navigation.stepper";
import { ToolbarPage } from "../pages/toolbar.page";
import { CanvasPage } from "../pages/canvas.page";
import { ReadOnlyPreviewPage } from "../pages/readonly-preview.page";
import {
  assertReadOnlyPreviewAbsent,
  assertCssRuleRegistered,
} from "../asserters/readonly-preview.asserter";

// ── S7.1 — Zustand store (cold-load initial state) ────────────────────────

test.describe("S7.1 — Zustand store initializes with null diagram", () => {
  test("store diagram is null on cold load — canvas shows 'No diagram open' title", async ({
    page,
  }) => {
    await loadApp(page);
    const canvas = new CanvasPage(page);
    await expect(canvas.emptyTitle).toHaveText("No diagram open");
  });

  test("store undoStack is empty — Undo button is disabled on cold load", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await expect(tb.undo).toBeDisabled();
  });

  test("store redoStack is empty — Redo button is disabled on cold load", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await expect(tb.redo).toBeDisabled();
  });
});

// ── S7.2 — Serializer: entry-point wiring & guard ─────────────────────────

test.describe("S7.2 — Serializer not triggered without open diagram", () => {
  test("Save button carries the correct aria-label for accessibility", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await expect(tb.save).toHaveAttribute("aria-label", "Save");
  });

  test("Save button title includes Ctrl+S keyboard shortcut", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    const title = await tb.save.getAttribute("title");
    expect(title, "Save button title should mention Ctrl+S shortcut").toContain(
      "Ctrl+S",
    );
  });

  test("Save button is disabled when diagram is null — serializer is never called", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await expect(tb.save).toBeDisabled();
  });

  test("Export button is disabled when diagram is null — no exported content to serialize", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await expect(tb.exportBtn).toBeDisabled();
  });
});

// ── S7.3 — Parser: ReadOnlyPreview CSS classes bundled in stylesheet ──────

test.describe("S7.3 — ReadOnlyPreview CSS class registration in loaded stylesheet", () => {
  test(".readonly-preview CSS rule is present in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    await assertCssRuleRegistered(page, ".readonly-preview");
  });

  test(".readonly-banner CSS rule is present in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    await assertCssRuleRegistered(page, ".readonly-banner");
  });

  test(".readonly-banner__text CSS rule is present in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    await assertCssRuleRegistered(page, ".readonly-banner__text");
  });

  test(".readonly-diagram CSS rule is present in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    await assertCssRuleRegistered(page, ".readonly-diagram");
  });

  test(".readonly-error CSS rule is present in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    await assertCssRuleRegistered(page, ".readonly-error");
  });
});

// ── S7.4 — ReadOnlyPreview absent when no diagram is open ─────────────────

test.describe("S7.4 — ReadOnlyPreview not rendered before a diagram is loaded", () => {
  test(".readonly-preview is not in the DOM on cold load", async ({ page }) => {
    await loadApp(page);
    const preview = new ReadOnlyPreviewPage(page);
    await expect(preview.preview).toHaveCount(0);
  });

  test(".readonly-banner is not in the DOM on cold load", async ({ page }) => {
    await loadApp(page);
    const preview = new ReadOnlyPreviewPage(page);
    await expect(preview.banner).toHaveCount(0);
  });

  test(".readonly-diagram is not in the DOM on cold load", async ({ page }) => {
    await loadApp(page);
    const preview = new ReadOnlyPreviewPage(page);
    await expect(preview.diagram).toHaveCount(0);
  });

  test(".readonly-error is not in the DOM on cold load", async ({ page }) => {
    await loadApp(page);
    const preview = new ReadOnlyPreviewPage(page);
    await expect(preview.error).toHaveCount(0);
  });

  test("composite ReadOnlyPreview absence check passes on cold load", async ({
    page,
  }) => {
    await loadApp(page);
    const preview = new ReadOnlyPreviewPage(page);
    await assertReadOnlyPreviewAbsent(preview);
  });
});
