import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the left sidebar in its no-directory (empty) state.
 * Encapsulates selectors shown before any folder is opened (S3.1).
 */
export class SidebarEmptyPage {
  readonly page: Page;

  /** Outer empty-state wrapper */
  readonly container: Locator;

  /** "Open a folder to get started" label */
  readonly label: Locator;

  /** Open Folder button rendered inside the sidebar empty state */
  readonly openFolderBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator(".sidebar-empty");
    this.label = page.locator(".sidebar-empty-label");
    this.openFolderBtn = page.locator(".sidebar-open-btn");
  }
}
