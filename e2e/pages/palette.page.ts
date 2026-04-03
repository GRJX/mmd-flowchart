import { type Page, type Locator } from "@playwright/test";

/** Names and aria-labels for every palette entry, in spec order */
export const PALETTE_ENTRIES = [
  { type: "start", label: "Start", ariaLabel: "Add Start block" },
  { type: "action", label: "Action", ariaLabel: "Add Action block" },
  { type: "decision", label: "Decision", ariaLabel: "Add Decision block" },
  { type: "result", label: "Result", ariaLabel: "Add Result block" },
  { type: "end", label: "End", ariaLabel: "Add End block" },
] as const;

/**
 * Page Object Model for the right-panel BlockPalette.
 * Covers palette mode (no block selected) and properties mode header.
 */
export class PalettePage {
  readonly page: Page;

  /** Outer right-panel container */
  readonly panel: Locator;

  /** Panel header element */
  readonly header: Locator;

  /** "Blocks" label shown in palette mode */
  readonly paletteLabel: Locator;

  /** All palette entry rows */
  readonly entries: Locator;

  /** Back-to-palette button shown in properties mode */
  readonly backBtn: Locator;

  /** Properties-mode header title (e.g. "Action Block") */
  readonly propertiesTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator(".right-panel");
    this.header = page.locator(".panel-header");
    this.paletteLabel = page.locator(".panel-header-label");
    this.entries = page.locator(".palette-entry");
    this.backBtn = page.locator('[aria-label="Back to palette"]');
    this.propertiesTitle = page.locator(".panel-header-title");
  }

  /** Locator for a single palette entry by its aria-label */
  entry(ariaLabel: string): Locator {
    return this.page.locator(`[aria-label="${ariaLabel}"]`);
  }
}
