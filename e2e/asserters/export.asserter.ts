import { expect, type Page } from "@playwright/test";
import { ToolbarPage } from "../pages/toolbar.page";

/**
 * Assert that the Export dropdown button is in the expected disabled state
 * when no diagram is open (Export requires an open DiagramFile).
 */
export async function assertExportButtonDisabled(
  tb: ToolbarPage,
): Promise<void> {
  await expect(tb.exportBtn).toBeDisabled();
}

/**
 * Assert that the Export dropdown button is visible and has the required
 * ARIA attributes for menu disclosure pattern.
 */
export async function assertExportButtonAttributes(
  tb: ToolbarPage,
): Promise<void> {
  await expect(tb.exportBtn).toHaveAttribute("aria-label", "Export");
  await expect(tb.exportBtn).toHaveAttribute("aria-haspopup", "menu");
  const expanded = await tb.exportBtn.getAttribute("aria-expanded");
  expect(expanded, "aria-expanded should be 'false' when menu is closed").toBe(
    "false",
  );
}

/**
 * Assert that a given CSS selector has a rule registered in the document's
 * loaded stylesheets. Cross-origin sheets are skipped silently.
 */
export async function assertExportCssRuleRegistered(
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
