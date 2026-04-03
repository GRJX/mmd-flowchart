import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the top toolbar.
 * Each property maps to one toolbar control via its aria-label.
 * No assertions live here.
 */
export class ToolbarPage {
  readonly page: Page;

  /** Outer toolbar div */
  readonly toolbar: Locator;

  /** App logo / name mark */
  readonly logo: Locator;

  /** Open Folder button */
  readonly openFolder: Locator;

  /** Save button */
  readonly save: Locator;

  /** New Diagram button */
  readonly newDiagram: Locator;

  /** Export dropdown button */
  readonly exportBtn: Locator;

  /** Fit to Screen button */
  readonly fitToScreen: Locator;

  /** Zoom Out button */
  readonly zoomOut: Locator;

  /** Zoom % display button (double-click resets to 100%) */
  readonly zoomPct: Locator;

  /** Zoom In button */
  readonly zoomIn: Locator;

  /** Undo button */
  readonly undo: Locator;

  /** Redo button */
  readonly redo: Locator;

  /** Dark/Light mode toggle button */
  readonly themeToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toolbar = page.locator(".toolbar");
    this.logo = page.locator('[aria-label="MMD Flowchart Editor"]');
    this.openFolder = page.locator('[aria-label="Open Folder"]');
    this.save = page.locator('[aria-label="Save"]');
    this.newDiagram = page.locator('[aria-label="New Diagram"]');
    this.exportBtn = page.locator('[aria-label="Export"]');
    this.fitToScreen = page.locator('[aria-label="Fit to Screen"]');
    this.zoomOut = page.locator('[aria-label="Zoom Out"]');
    this.zoomPct = page.locator(".toolbar-zoom-pct");
    this.zoomIn = page.locator('[aria-label="Zoom In"]');
    this.undo = page.locator('[aria-label="Undo"]');
    this.redo = page.locator('[aria-label="Redo"]');
    // aria-label changes with theme — match both states
    this.themeToggle = page.locator(
      '[aria-label="Switch to Light Mode"], [aria-label="Switch to Dark Mode"]',
    );
  }
}
