import { expect } from "@playwright/test";
import { PropertiesPanelPage, CommentDotPage } from "../pages/properties-panel.page";

/**
 * Asserts that the right panel is displaying the palette (default) mode:
 * - right-panel is visible
 * - panel-header--palette with "Blocks" label
 * - no back button (that belongs to properties mode)
 * - no .block-properties panel
 * - no .comment-panel
 */
export async function assertPaletteHeaderMode(
  props: PropertiesPanelPage,
): Promise<void> {
  await expect(props.rightPanel).toBeVisible();
  await expect(props.paletteLabel).toHaveText("Blocks");
  await expect(props.backBtn).toHaveCount(0);
  await expect(props.blockProperties).toHaveCount(0);
  await expect(props.commentPanel).toHaveCount(0);
}

/**
 * Asserts the initial idle state of all Epic #6 elements:
 * - no .block-properties visible
 * - no .comment-panel visible
 * - no .comment-dot elements (no blocks loaded)
 */
export async function assertEpic6IdleState(
  props: PropertiesPanelPage,
  dots: CommentDotPage,
): Promise<void> {
  await expect(props.blockProperties).toHaveCount(0);
  await expect(props.commentPanel).toHaveCount(0);
  await expect(dots.all).toHaveCount(0);
}

/**
 * Asserts the comment panel structure when it IS open.
 * Only used in tests where the comment panel has been triggered.
 */
export async function assertCommentPanelStructure(
  props: PropertiesPanelPage,
): Promise<void> {
  await expect(props.commentPanel).toBeVisible();
  await expect(props.backBtn).toBeVisible();
  await expect(props.backBtn).toHaveAttribute("aria-label", "Back to properties");
  await expect(props.panelTitle).toHaveText("Comments");
  await expect(props.commentAddInput).toBeVisible();
  await expect(props.commentAddInput).toHaveAttribute("maxlength", "2000");
  await expect(props.commentAddBtn).toBeVisible();
  await expect(props.commentAddBtn).toBeDisabled(); // disabled when input empty
}
