import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the canvas area.
 * Covers both the empty state (no diagram open) and the React Flow wrapper
 * when a diagram is loaded.
 */
export class CanvasPage {
  readonly page: Page;

  /** App-shell canvas slot — always present */
  readonly canvasSlot: Locator;

  /** Empty-state container shown when no diagram is open */
  readonly emptyState: Locator;

  /** "No diagram open" heading inside the empty state */
  readonly emptyTitle: Locator;

  /** Hint text inside the empty state */
  readonly emptyHint: Locator;

  constructor(page: Page) {
    this.page = page;
    this.canvasSlot = page.locator(".app-canvas");
    this.emptyState = page.locator(".canvas-empty");
    this.emptyTitle = page.locator(".canvas-empty-title");
    this.emptyHint = page.locator(".canvas-empty-hint");
  }
}
