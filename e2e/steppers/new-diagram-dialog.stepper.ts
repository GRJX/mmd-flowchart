import { type Page } from "@playwright/test";
import { NewDiagramDialogPage } from "../pages/new-diagram-dialog.page";

export interface DialogOpenResult {
  dialog: NewDiagramDialogPage;
}

/**
 * Click the New Diagram toolbar button and wait for the dialog to appear.
 * Returns the NewDiagramDialogPage POM.
 */
export async function openNewDiagramDialog(
  page: Page,
): Promise<DialogOpenResult> {
  await page.locator('[aria-label="New Diagram"]').click();
  const dialog = new NewDiagramDialogPage(page);
  await dialog.overlay.waitFor({ state: "visible" });
  return { dialog };
}

/**
 * Fill the filename input and click Create.
 * The caller is responsible for asserting post-creation state.
 */
export async function submitNewDiagramDialog(
  page: Page,
  filename: string,
): Promise<void> {
  const { dialog } = await openNewDiagramDialog(page);
  await dialog.filenameInput.fill(filename);
  await dialog.createBtn.click();
}

/**
 * Open the New Diagram dialog then click Cancel.
 */
export async function cancelNewDiagramDialog(page: Page): Promise<void> {
  const { dialog } = await openNewDiagramDialog(page);
  await dialog.cancelBtn.click();
}
