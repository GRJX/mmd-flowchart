import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the New Diagram dialog (S3.5).
 * Rendered by NewDiagramDialog.tsx when the user clicks New Diagram.
 */
export class NewDiagramDialogPage {
  readonly page: Page;

  /** Dialog overlay element */
  readonly overlay: Locator;

  /** Dialog container */
  readonly dialog: Locator;

  /** "New Diagram" heading */
  readonly title: Locator;

  /** "Filename:" label */
  readonly filenameLabel: Locator;

  /** Text input for the diagram name */
  readonly filenameInput: Locator;

  /** ".mmd extension added automatically" hint */
  readonly hint: Locator;

  /** Cancel button */
  readonly cancelBtn: Locator;

  /** Create (submit) button */
  readonly createBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.overlay = page.locator(".dialog-overlay");
    this.dialog = page.locator('[role="dialog"][aria-label="New Diagram"]');
    this.title = page.locator(".dialog-title");
    this.filenameLabel = page.locator('label[for="new-diagram-name"]');
    this.filenameInput = page.locator("#new-diagram-name");
    this.hint = page.locator(".dialog-hint");
    this.cancelBtn = page.locator(".dialog-btn--secondary");
    this.createBtn = page.locator(".dialog-btn--primary");
  }
}
