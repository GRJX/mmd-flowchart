import { type Page } from "@playwright/test";
import { ToolbarPage } from "../pages/toolbar.page";

export interface ThemeToggleResult {
  toolbar: ToolbarPage;
}

/**
 * Click the dark/light mode toggle and return the ToolbarPage POM.
 * Waits for the aria-label to update before returning, so subsequent
 * assertions see the post-toggle state.
 */
export async function toggleTheme(page: Page): Promise<ThemeToggleResult> {
  const toolbar = new ToolbarPage(page);
  // Read the current label so we can wait for it to change
  const currentLabel = await toolbar.themeToggle.getAttribute("aria-label");
  await toolbar.themeToggle.click();
  // Wait for the label to flip (React re-render)
  const nextLabel =
    currentLabel === "Switch to Light Mode"
      ? "Switch to Dark Mode"
      : "Switch to Light Mode";
  await page
    .locator(`[aria-label="${nextLabel}"]`)
    .waitFor({ state: "attached" });
  return { toolbar };
}
