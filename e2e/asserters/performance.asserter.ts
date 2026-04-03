import { type Page, expect } from "@playwright/test";

/**
 * Assert that the browser's DOMContentLoaded event fired within the given
 * time budget (default 2 000 ms), measured from the navigation start.
 *
 * Must be called AFTER the page has fully loaded (i.e. after `page.goto()`).
 */
export async function assertDomContentLoaded(
  page: Page,
  maxMs = 2000,
): Promise<void> {
  const dclMs = await page.evaluate(() => {
    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    return nav.domContentLoadedEventEnd - nav.startTime;
  });

  expect(
    dclMs,
    `DOMContentLoaded took ${dclMs} ms — limit is ${maxMs} ms`,
  ).toBeLessThanOrEqual(maxMs);
}
