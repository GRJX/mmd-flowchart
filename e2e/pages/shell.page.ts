import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the three-panel AppShell.
 * Exposes locators for every named panel, the toolbar, and the status bar.
 */
export class ShellPage {
  readonly page: Page;

  /** Outer shell wrapper */
  readonly shell: Locator;

  /** Top toolbar container */
  readonly toolbar: Locator;

  /** Left sidebar panel */
  readonly sidebar: Locator;

  /** Centre canvas panel */
  readonly canvas: Locator;

  /** Right properties panel */
  readonly rightPanel: Locator;

  /** Bottom status bar */
  readonly statusBar: Locator;

  /** Save-state dot inside the status bar */
  readonly statusDot: Locator;

  constructor(page: Page) {
    this.page = page;
    this.shell = page.locator(".app-shell");
    this.toolbar = page.locator(".app-toolbar");
    this.sidebar = page.locator(".app-sidebar");
    this.canvas = page.locator(".app-canvas");
    this.rightPanel = page.locator(".app-panel");
    this.statusBar = page.locator(".status-bar");
    this.statusDot = page.locator(".status-dot");
  }
}
