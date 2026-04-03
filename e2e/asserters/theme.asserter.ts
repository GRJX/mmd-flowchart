import { type Page, expect } from "@playwright/test";

type Theme = "dark" | "light";

/**
 * Assert that the document is in dark mode (no data-theme attribute,
 * which is the canonical dark-mode default per §17).
 */
export async function assertDarkModeActive(page: Page): Promise<void> {
  const attr = await page.evaluate(() =>
    document.documentElement.getAttribute("data-theme"),
  );
  expect(attr, 'Dark mode: data-theme should be null, not "light"').toBeNull();
}

/**
 * Assert that the document is in light mode (data-theme="light" on
 * the root element per §17).
 */
export async function assertLightModeActive(page: Page): Promise<void> {
  const attr = await page.evaluate(() =>
    document.documentElement.getAttribute("data-theme"),
  );
  expect(attr, 'Light mode: data-theme should equal "light"').toBe("light");
}

/**
 * Assert that the given theme value is persisted in localStorage
 * under the key `mmd-theme` (S2.3 / §17).
 */
export async function assertThemePersisted(
  page: Page,
  expectedTheme: Theme,
): Promise<void> {
  const stored = await page.evaluate(() => localStorage.getItem("mmd-theme"));
  expect(
    stored,
    `localStorage["mmd-theme"] should be "${expectedTheme}", got "${stored}"`,
  ).toBe(expectedTheme);
}
