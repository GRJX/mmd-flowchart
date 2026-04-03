import { type Page, expect } from "@playwright/test";
import { type ShellPage } from "../pages/shell.page";

/**
 * Assert the three-panel layout dimensions match the spec:
 *   - left sidebar  → 240 px (S2.1)
 *   - right panel   → 280 px (S2.1)
 *   - centre canvas → fills remaining space (width > 0)
 */
export async function assertPanelWidths(shell: ShellPage): Promise<void> {
  const sidebarWidth = await shell.sidebar.evaluate(
    (el) => el.getBoundingClientRect().width,
  );
  const panelWidth = await shell.rightPanel.evaluate(
    (el) => el.getBoundingClientRect().width,
  );
  const canvasWidth = await shell.canvas.evaluate(
    (el) => el.getBoundingClientRect().width,
  );

  expect(
    sidebarWidth,
    `Sidebar width should be 240 px, got ${sidebarWidth}`,
  ).toBe(240);
  expect(
    panelWidth,
    `Right panel width should be 280 px, got ${panelWidth}`,
  ).toBe(280);
  expect(
    canvasWidth,
    "Centre canvas should have positive width",
  ).toBeGreaterThan(0);
}

/**
 * Assert the status bar is exactly 24 px tall and visible at the
 * bottom of the viewport (S2.1 / §6.5).
 */
export async function assertStatusBarHeight(
  page: Page,
  shell: ShellPage,
): Promise<void> {
  const height = await shell.statusBar.evaluate(
    (el) => el.getBoundingClientRect().height,
  );
  expect(height, `Status bar height should be 24 px, got ${height}`).toBe(24);

  // Status bar bottom edge should be at the viewport bottom
  const { bottom: barBottom } = await shell.statusBar.evaluate((el) =>
    el.getBoundingClientRect(),
  );
  const vpHeight = await page.evaluate(() => window.innerHeight);
  expect(
    barBottom,
    `Status bar bottom (${barBottom}) should align with viewport bottom (${vpHeight})`,
  ).toBe(vpHeight);
}
