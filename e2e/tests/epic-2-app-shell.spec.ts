/**
 * Epic #2 — Application shell, layout & dark mode
 * Functional acceptance tests (Issue #2, Stories #12, #13, #14)
 *
 * Run against the dev server (default):
 *   npx playwright test
 */

import { test, expect } from "@playwright/test";
import { ShellPage } from "../pages/shell.page";
import { ToolbarPage } from "../pages/toolbar.page";
import { loadApp } from "../steppers/navigation.stepper";
import { toggleTheme } from "../steppers/theme.stepper";
import { assertPanelWidths, assertStatusBarHeight } from "../asserters/layout.asserter";
import {
  assertDarkModeActive,
  assertLightModeActive,
  assertThemePersisted,
} from "../asserters/theme.asserter";

// ── S2.1 — Three-panel layout & status bar ─────────────────────────────────

test.describe("S2.1 — Three-panel layout", () => {
  test("left sidebar is 240 px, right panel is 280 px, centre fills remainder", async ({
    page,
  }) => {
    await loadApp(page);
    const shell = new ShellPage(page);
    await assertPanelWidths(shell);
  });

  test("status bar is 24 px tall and anchored to the viewport bottom", async ({
    page,
  }) => {
    await loadApp(page);
    const shell = new ShellPage(page);
    await assertStatusBarHeight(page, shell);
  });

  test("status bar shows save-state dot on load", async ({ page }) => {
    await loadApp(page);
    const shell = new ShellPage(page);
    await expect(shell.statusDot).toBeVisible();
  });
});

// ── S2.2 — Toolbar — exact left-to-right control order ────────────────────

test.describe("S2.2 — Toolbar controls", () => {
  test("all required controls are present in the toolbar", async ({ page }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);

    await expect(tb.logo).toBeVisible();
    await expect(tb.openFolder).toBeVisible();
    await expect(tb.save).toBeVisible();
    await expect(tb.newDiagram).toBeVisible();
    await expect(tb.exportBtn).toBeVisible();
    await expect(tb.fitToScreen).toBeVisible();
    await expect(tb.zoomOut).toBeVisible();
    await expect(tb.zoomPct).toBeVisible();
    await expect(tb.zoomIn).toBeVisible();
    await expect(tb.undo).toBeVisible();
    await expect(tb.redo).toBeVisible();
    await expect(tb.themeToggle).toBeVisible();
  });

  test("toolbar controls appear in the canonical left-to-right order", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);

    // Collect horizontal centre-x for each labelled control in spec order
    const controls = [
      tb.logo,
      tb.openFolder,
      tb.save,
      tb.newDiagram,
      tb.exportBtn,
      tb.fitToScreen,
      tb.zoomOut,
      tb.zoomPct,
      tb.zoomIn,
      tb.undo,
      tb.redo,
      tb.themeToggle,
    ];

    const xs = await Promise.all(
      controls.map((loc) =>
        loc.evaluate((el) => el.getBoundingClientRect().left),
      ),
    );

    // Each item must be to the right of (or level with) the previous
    for (let i = 1; i < xs.length; i++) {
      expect(
        xs[i],
        `Control[${i}] (x=${xs[i]}) must be to the right of Control[${i - 1}] (x=${xs[i - 1]})`,
      ).toBeGreaterThanOrEqual(xs[i - 1]!);
    }
  });

  test("zoom % display shows 100% on initial load", async ({ page }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await expect(tb.zoomPct).toHaveText("100%");
  });

  test("Undo and Redo are disabled when history stack is empty", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await expect(tb.undo).toBeDisabled();
    await expect(tb.redo).toBeDisabled();
  });

  test("Save, Export, and Fit to Screen are disabled when no file is open", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await expect(tb.save).toBeDisabled();
    await expect(tb.exportBtn).toBeDisabled();
    await expect(tb.fitToScreen).toBeDisabled();
  });
});

// ── S2.3 — Dark mode toggle & localStorage persistence ────────────────────

test.describe("S2.3 — Dark mode & CSS tokens", () => {
  test("dark mode is the default on first load (no data-theme attribute)", async ({
    page,
  }) => {
    // Clear storage so there is no previous preference
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("mmd-theme"));
    await page.reload();
    await assertDarkModeActive(page);
  });

  test("dark mode toggle switch to light mode and sets data-theme='light'", async ({
    page,
  }) => {
    await loadApp(page);
    await toggleTheme(page); // dark → light
    await assertLightModeActive(page);
  });

  test("toggling twice returns to dark mode", async ({ page }) => {
    await loadApp(page);
    await toggleTheme(page); // dark → light
    await toggleTheme(page); // light → dark
    await assertDarkModeActive(page);
  });

  test("theme choice is written to localStorage after toggle", async ({
    page,
  }) => {
    await loadApp(page);
    await toggleTheme(page); // dark → light
    await assertThemePersisted(page, "light");
  });

  test("theme persists across page reload", async ({ page }) => {
    await loadApp(page);
    await toggleTheme(page); // dark → light
    await page.reload();
    await assertLightModeActive(page);
  });

  test("theme toggle button shows sun icon in dark mode", async ({ page }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    // In dark mode the button's label is "Switch to Light Mode" (shows sun)
    await expect(
      page.locator('[aria-label="Switch to Light Mode"]'),
    ).toBeVisible();
  });

  test("theme toggle button shows moon icon in light mode", async ({ page }) => {
    await loadApp(page);
    await toggleTheme(page); // dark → light
    // In light mode the button's label is "Switch to Dark Mode" (shows moon)
    await expect(
      page.locator('[aria-label="Switch to Dark Mode"]'),
    ).toBeVisible();
  });

  test("all required CSS design tokens are defined on :root", async ({
    page,
  }) => {
    await loadApp(page);

    const requiredTokens = [
      "--bg-app",
      "--bg-panel",
      "--bg-sidebar",
      "--bg-canvas",
      "--bg-hover",
      "--bg-active",
      "--bg-input",
      "--bg-dialog",
      "--border",
      "--border-hi",
      "--text",
      "--text-muted",
      "--text-dim",
      "--accent",
      "--accent2",
      "--green",
      "--red",
      "--yellow",
      "--orange",
      "--teal",
    ];

    const missingTokens = await page.evaluate((tokens) => {
      const styles = getComputedStyle(document.documentElement);
      return tokens.filter((t) => styles.getPropertyValue(t).trim() === "");
    }, requiredTokens);

    expect(
      missingTokens,
      `Missing CSS tokens: ${missingTokens.join(", ")}`,
    ).toHaveLength(0);
  });
});
