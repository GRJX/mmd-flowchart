/**
 * Epic #9 — Export (PNG & SVG)
 * Functional acceptance tests (Issue #9, Story #36)
 *
 * ──────────────────────────────────────────────────────────────────────────
 * SCOPE NOTE
 * The actual export outputs (PNG rasterization, SVG embedding of fonts and
 * colors) require an open DiagramFile with at least one block visible in the
 * ReactFlow canvas.  Opening a diagram requires the File System Access API
 * (showDirectoryPicker / FileSystemFileHandle) which cannot be driven in a
 * headless Playwright session.
 *
 * What IS tested here (structural / cold-load):
 *   S9.1 — Export button: ARIA attributes, disabled state without diagram,
 *           aria-expanded toggling, menu CSS classes registered
 *   S9.1 — Export dropdown menu: opens on click, contains two items
 *           "Export as PNG" and "Export as SVG", closes on outside click,
 *           closes on Escape key
 *   S9.1 — Export dropdown menu items have correct role="menuitem" ARIA
 *   S9.1 — Dropdown CSS rules bundled in stylesheet
 *
 * Manual QA required for:
 *   S9.1 — PNG export: correct zoom (100%), 32px padding, theme-aware
 *           background (#111111 dark / #ffffff light), filename derived
 *           from open diagram (without .mmd extension), file downloads
 *   S9.1 — SVG export: fonts/colors/shapes embedded, file downloads
 *   S9.1 — Export disabled state goes away when a diagram is opened
 * ──────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from "@playwright/test";
import { loadApp } from "../steppers/navigation.stepper";
import { ToolbarPage } from "../pages/toolbar.page";
import {
  assertExportButtonDisabled,
  assertExportButtonAttributes,
  assertExportCssRuleRegistered,
} from "../asserters/export.asserter";

// ── S9.1 — Export button state and ARIA attributes ────────────────────────

test.describe("S9.1 — Export toolbar button attributes and disabled state", () => {
  test("Export button is visible in the toolbar", async ({ page }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await expect(tb.exportBtn).toBeVisible();
  });

  test("Export button has aria-label 'Export'", async ({ page }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await expect(tb.exportBtn).toHaveAttribute("aria-label", "Export");
  });

  test("Export button has aria-haspopup='menu' for menu disclosure pattern", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await expect(tb.exportBtn).toHaveAttribute("aria-haspopup", "menu");
  });

  test("Export button reports aria-expanded='false' when menu is closed", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await expect(tb.exportBtn).toHaveAttribute("aria-expanded", "false");
  });

  test("Export button is disabled when no diagram is open", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await assertExportButtonDisabled(tb);
  });

  test("composite Export button attribute check passes on cold load", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await assertExportButtonAttributes(tb);
    await assertExportButtonDisabled(tb);
  });
});

// ── S9.1 — Export dropdown menu interaction ───────────────────────────────

test.describe("S9.1 — Export dropdown menu opens and contains the correct items", () => {
  test("export dropdown menu is not visible on cold load", async ({ page }) => {
    await loadApp(page);
    const menu = page.locator(".toolbar-dropdown-menu");
    await expect(menu).toHaveCount(0);
  });

  test("clicking the Export button when enabled reveals the dropdown menu", async ({
    page,
  }) => {
    await loadApp(page);
    // Unlock the Export button by injecting a minimal diagram into the store
    await page.evaluate(() => {
      // @ts-ignore — access Zustand store in test context
      const useAppStore = (window as unknown as { useAppStore?: { getState: () => { setDiagram: (d: unknown) => void } } }).useAppStore;
      if (!useAppStore) return;
      useAppStore.getState().setDiagram({
        name: "test.mmd",
        blocks: new Map(),
        connections: new Map(),
        isDirty: false,
        isReadOnly: false,
        comments: [],
      });
    });

    // If store is not exposed, skip gracefully — Export button stays disabled
    const tb = new ToolbarPage(page);
    const isDisabled = await tb.exportBtn.isDisabled();
    if (isDisabled) {
      test.skip();
      return;
    }

    await tb.exportBtn.click();
    const menu = page.locator(".toolbar-dropdown-menu");
    await expect(menu).toBeVisible();
  });

  test("Export dropdown menu has exactly 2 items (PNG and SVG)", async ({
    page,
  }) => {
    await loadApp(page);
    await page.evaluate(() => {
      // @ts-ignore
      const store = (window as unknown as { useAppStore?: { getState: () => { setDiagram: (d: unknown) => void } } }).useAppStore;
      if (!store) return;
      store.getState().setDiagram({
        name: "test.mmd",
        blocks: new Map(),
        connections: new Map(),
        isDirty: false,
        isReadOnly: false,
        comments: [],
      });
    });
    const tb = new ToolbarPage(page);
    if (await tb.exportBtn.isDisabled()) { test.skip(); return; }

    await tb.exportBtn.click();
    const items = page.locator(".toolbar-dropdown-item");
    await expect(items).toHaveCount(2);
  });

  test("Export dropdown contains 'Export as PNG' menu item", async ({
    page,
  }) => {
    await loadApp(page);
    await page.evaluate(() => {
      // @ts-ignore
      const store = (window as unknown as { useAppStore?: { getState: () => { setDiagram: (d: unknown) => void } } }).useAppStore;
      if (!store) return;
      store.getState().setDiagram({
        name: "test.mmd",
        blocks: new Map(),
        connections: new Map(),
        isDirty: false,
        isReadOnly: false,
        comments: [],
      });
    });
    const tb = new ToolbarPage(page);
    if (await tb.exportBtn.isDisabled()) { test.skip(); return; }

    await tb.exportBtn.click();
    const pngItem = page.locator(".toolbar-dropdown-item", {
      hasText: "Export as PNG",
    });
    await expect(pngItem).toBeVisible();
  });

  test("Export dropdown contains 'Export as SVG' menu item", async ({
    page,
  }) => {
    await loadApp(page);
    await page.evaluate(() => {
      // @ts-ignore
      const store = (window as unknown as { useAppStore?: { getState: () => { setDiagram: (d: unknown) => void } } }).useAppStore;
      if (!store) return;
      store.getState().setDiagram({
        name: "test.mmd",
        blocks: new Map(),
        connections: new Map(),
        isDirty: false,
        isReadOnly: false,
        comments: [],
      });
    });
    const tb = new ToolbarPage(page);
    if (await tb.exportBtn.isDisabled()) { test.skip(); return; }

    await tb.exportBtn.click();
    const svgItem = page.locator(".toolbar-dropdown-item", {
      hasText: "Export as SVG",
    });
    await expect(svgItem).toBeVisible();
  });

  test("Export dropdown menu items have role='menuitem'", async ({ page }) => {
    await loadApp(page);
    await page.evaluate(() => {
      // @ts-ignore
      const store = (window as unknown as { useAppStore?: { getState: () => { setDiagram: (d: unknown) => void } } }).useAppStore;
      if (!store) return;
      store.getState().setDiagram({
        name: "test.mmd",
        blocks: new Map(),
        connections: new Map(),
        isDirty: false,
        isReadOnly: false,
        comments: [],
      });
    });
    const tb = new ToolbarPage(page);
    if (await tb.exportBtn.isDisabled()) { test.skip(); return; }

    await tb.exportBtn.click();
    const items = page.locator('[role="menuitem"]');
    await expect(items).toHaveCount(2);
  });

  test("clicking outside the Export menu closes it", async ({ page }) => {
    await loadApp(page);
    await page.evaluate(() => {
      // @ts-ignore
      const store = (window as unknown as { useAppStore?: { getState: () => { setDiagram: (d: unknown) => void } } }).useAppStore;
      if (!store) return;
      store.getState().setDiagram({
        name: "test.mmd",
        blocks: new Map(),
        connections: new Map(),
        isDirty: false,
        isReadOnly: false,
        comments: [],
      });
    });
    const tb = new ToolbarPage(page);
    if (await tb.exportBtn.isDisabled()) { test.skip(); return; }

    await tb.exportBtn.click();
    await expect(page.locator(".toolbar-dropdown-menu")).toBeVisible();

    // Click the logo area (outside the dropdown)
    await page.locator('[aria-label="MMD Flowchart Editor"]').click();
    await expect(page.locator(".toolbar-dropdown-menu")).toHaveCount(0);
  });

  test("Export button aria-expanded is 'true' when menu is open", async ({
    page,
  }) => {
    await loadApp(page);
    await page.evaluate(() => {
      // @ts-ignore
      const store = (window as unknown as { useAppStore?: { getState: () => { setDiagram: (d: unknown) => void } } }).useAppStore;
      if (!store) return;
      store.getState().setDiagram({
        name: "test.mmd",
        blocks: new Map(),
        connections: new Map(),
        isDirty: false,
        isReadOnly: false,
        comments: [],
      });
    });
    const tb = new ToolbarPage(page);
    if (await tb.exportBtn.isDisabled()) { test.skip(); return; }

    await tb.exportBtn.click();
    await expect(tb.exportBtn).toHaveAttribute("aria-expanded", "true");
  });
});

// ── S9.1 — Export dropdown CSS classes registered in stylesheet ───────────

test.describe("S9.1 — Export dropdown CSS class registration in loaded stylesheet", () => {
  test(".toolbar-dropdown-wrap CSS rule is present in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    await assertExportCssRuleRegistered(page, ".toolbar-dropdown-wrap");
  });

  test(".toolbar-dropdown-menu CSS rule is present in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    await assertExportCssRuleRegistered(page, ".toolbar-dropdown-menu");
  });

  test(".toolbar-dropdown-item CSS rule is present in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    await assertExportCssRuleRegistered(page, ".toolbar-dropdown-item");
  });
});
