/**
 * Epic #4 — Canvas, block system & palette
 * Functional acceptance tests (Issue #4, Stories #20–#24)
 *
 * ──────────────────────────────────────────────────────────────────────────
 * SCOPE NOTE
 * Stories S4.2, S4.4, and S4.5 require an open DiagramFile, which is only
 * created by the file-system hooks after a real FileSystemFileHandle is
 * obtained from showDirectoryPicker or createMmdFile. These native OS-level
 * calls cannot be driven headlessly.
 *
 * What IS tested here:
 *   S4.1 — Canvas empty state when no diagram is open
 *   S4.3 — Block palette: structure, header, all 5 entries, SVG previews,
 *           draggability, Start-entry greyed behaviour, keyboard accessibility
 *   S4.4 — Palette entries report aria-label for "Add <Type> block"
 * ──────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from "@playwright/test";
import { loadApp } from "../steppers/navigation.stepper";
import { CanvasPage } from "../pages/canvas.page";
import { PalettePage, PALETTE_ENTRIES } from "../pages/palette.page";
import {
  assertPaletteMode,
  assertAllPaletteEntriesPresent,
  assertPalettePreviewsExist,
} from "../asserters/palette.asserter";

// ── S4.1 — Canvas empty state ─────────────────────────────────────────────

test.describe("S4.1 — Canvas empty state (no diagram open)", () => {
  test("canvas slot is present in the layout", async ({ page }) => {
    await loadApp(page);
    const canvas = new CanvasPage(page);
    await expect(canvas.canvasSlot).toBeVisible();
  });

  test("canvas shows 'No diagram open' title when no file is loaded", async ({
    page,
  }) => {
    await loadApp(page);
    const canvas = new CanvasPage(page);
    await expect(canvas.emptyTitle).toHaveText("No diagram open");
  });

  test("canvas shows hint to open a folder when no file is loaded", async ({
    page,
  }) => {
    await loadApp(page);
    const canvas = new CanvasPage(page);
    await expect(canvas.emptyHint).toContainText("Open a folder");
  });
});

// ── S4.3 — Block palette header & entries ────────────────────────────────

test.describe("S4.3 — Block palette (palette mode)", () => {
  test("right panel is visible on load", async ({ page }) => {
    await loadApp(page);
    const palette = new PalettePage(page);
    await assertPaletteMode(palette);
  });

  test("panel header shows 'Blocks' label in palette mode", async ({
    page,
  }) => {
    await loadApp(page);
    const palette = new PalettePage(page);
    await expect(palette.paletteLabel).toHaveText("Blocks");
  });

  test("palette renders exactly 5 block-type entries", async ({ page }) => {
    await loadApp(page);
    const palette = new PalettePage(page);
    await expect(palette.entries).toHaveCount(5);
  });

  test("all 5 palette entries are visible with correct aria-labels", async ({
    page,
  }) => {
    await loadApp(page);
    const palette = new PalettePage(page);
    await assertAllPaletteEntriesPresent(palette);
  });

  test("palette entries contain inline SVG previews", async ({ page }) => {
    await loadApp(page);
    const palette = new PalettePage(page);
    await assertPalettePreviewsExist(palette);
  });

  test("palette entries appear in spec order: Start, Action, Decision, Result, End", async ({
    page,
  }) => {
    await loadApp(page);
    const palette = new PalettePage(page);

    const labels = await palette.entries.evaluateAll((els) =>
      els.map((el) => el.querySelector(".palette-label")?.textContent?.trim() ?? ""),
    );

    const expectedOrder = PALETTE_ENTRIES.map((e) => e.label);
    expect(labels).toEqual(expectedOrder);
  });

  test("Start palette entry is enabled when no diagram is loaded", async ({
    page,
  }) => {
    await loadApp(page);
    const palette = new PalettePage(page);
    const startEntry = palette.entry("Add Start block");
    await expect(startEntry).not.toHaveClass(/palette-entry--disabled/);
    await expect(startEntry).toHaveAttribute("aria-disabled", "false");
  });
});

// ── S4.4 — Palette entry interaction attributes ───────────────────────────

test.describe("S4.4 — Palette entry accessibility & drag attributes", () => {
  test("each palette entry has role='button'", async ({ page }) => {
    await loadApp(page);
    const palette = new PalettePage(page);
    const count = await palette.entries.count();
    for (let i = 0; i < count; i++) {
      await expect(palette.entries.nth(i)).toHaveAttribute("role", "button");
    }
  });

  test("each enabled palette entry has tabIndex 0 (keyboard reachable)", async ({
    page,
  }) => {
    await loadApp(page);
    const palette = new PalettePage(page);
    const count = await palette.entries.count();
    for (let i = 0; i < count; i++) {
      const tabIndex = await palette.entries.nth(i).getAttribute("tabindex");
      expect(Number(tabIndex)).toBeGreaterThanOrEqual(0);
    }
  });

  test("each enabled palette entry is draggable", async ({ page }) => {
    await loadApp(page);
    const palette = new PalettePage(page);
    const count = await palette.entries.count();
    for (let i = 0; i < count; i++) {
      const draggable = await palette.entries.nth(i).getAttribute("draggable");
      expect(draggable, `Entry ${i} should be draggable`).toBe("true");
    }
  });
});
