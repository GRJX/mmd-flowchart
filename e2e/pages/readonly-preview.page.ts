import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the ReadOnlyPreview component.
 * Rendered only when `diagram.isReadOnly === true` (e.g. non-flowchart file,
 * or diagram with >200 blocks).
 * No assertions live here.
 */
export class ReadOnlyPreviewPage {
  readonly page: Page;

  /** Root container — .readonly-preview */
  readonly preview: Locator;

  /** Warning banner strip — .readonly-banner */
  readonly banner: Locator;

  /** Warning icon inside the banner — .readonly-banner__icon */
  readonly bannerIcon: Locator;

  /** Banner text paragraph — .readonly-banner__text */
  readonly bannerText: Locator;

  /** Mermaid SVG render target — .readonly-diagram */
  readonly diagram: Locator;

  /** Error message shown when mermaid fails to render — .readonly-error */
  readonly error: Locator;

  constructor(page: Page) {
    this.page = page;
    this.preview = page.locator(".readonly-preview");
    this.banner = page.locator(".readonly-banner");
    this.bannerIcon = page.locator(".readonly-banner__icon");
    this.bannerText = page.locator(".readonly-banner__text");
    this.diagram = page.locator(".readonly-diagram");
    this.error = page.locator(".readonly-error");
  }
}
