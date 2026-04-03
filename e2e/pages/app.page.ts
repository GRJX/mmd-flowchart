import { type Page, type Locator, type Response } from "@playwright/test";

/**
 * Page Object Model for the top-level application shell.
 * Encapsulates selectors and navigation for the app root.
 */
export class AppPage {
  readonly page: Page;
  readonly root: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator("#root");
  }

  /** Navigate to the app root and return the HTTP response. */
  async goto(): Promise<Response | null> {
    return this.page.goto("/");
  }

  /** Navigate to an arbitrary path and return the HTTP response. */
  async gotoPath(path: string): Promise<Response | null> {
    return this.page.goto(path);
  }
}
