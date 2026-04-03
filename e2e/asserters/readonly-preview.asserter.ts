import { expect, type Page } from "@playwright/test";
import { ReadOnlyPreviewPage } from "../pages/readonly-preview.page";

/**
 * Assert that no ReadOnlyPreview elements are present in the DOM.
 * Expected during cold load (no diagram open) and when an editable diagram
 * is active.
 */
export async function assertReadOnlyPreviewAbsent(
  previewPage: ReadOnlyPreviewPage,
): Promise<void> {
  await expect(previewPage.preview).toHaveCount(0);
  await expect(previewPage.banner).toHaveCount(0);
  await expect(previewPage.diagram).toHaveCount(0);
  await expect(previewPage.error).toHaveCount(0);
}

/**
 * Assert that a given CSS selector has a registered rule in the document's
 * loaded stylesheets. Cross-origin sheets are skipped silently.
 */
export async function assertCssRuleRegistered(
  page: Page,
  selector: string,
): Promise<void> {
  const found = await page.evaluate((sel) => {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules ?? [])) {
          const styleRule = rule as CSSStyleRule;
          if (
            styleRule.selectorText === sel ||
            (styleRule.selectorText ?? "").includes(sel)
          ) {
            return true;
          }
        }
      } catch {
        // Cross-origin stylesheet — skip
      }
    }
    return false;
  }, selector);

  expect(
    found,
    `CSS rule for "${selector}" should be present in the loaded stylesheet`,
  ).toBe(true);
}
