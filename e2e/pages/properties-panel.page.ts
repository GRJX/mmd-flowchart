import { type Page } from "@playwright/test";

/**
 * Page Object Model for Epic #6 — Properties panel & comment system.
 *
 * The right panel now switches between four modes depending on store state:
 *   1. palette mode   — no selection, palette entries
 *   2. block properties mode — single block selected, .block-properties
 *   3. comment panel mode — comment-dot clicked, .comment-panel
 *   4. connection properties mode — edge selected, .block-properties
 *
 * Modes 2–4 require a loaded DiagramFile (FileSystemFileHandle). The POM
 * exposes all locators; individual tests document which require a diagram.
 */
export class PropertiesPanelPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Panel container ────────────────────────────────────────────────────
  get rightPanel() {
    return this.page.locator(".right-panel");
  }

  // ── Palette mode header ────────────────────────────────────────────────
  /** "BLOCKS" label in palette mode header. */
  get paletteLabel() {
    return this.page.locator(".panel-header--palette .panel-header-label");
  }

  // ── Properties / comment mode header ──────────────────────────────────
  /** Back button (← arrow) shown in properties and comment panel mode. */
  get backBtn() {
    return this.page.locator(".panel-back-btn");
  }

  /** Title shown in properties mode: "{Type} Block" or "Comments". */
  get panelTitle() {
    return this.page.locator(".panel-header-title");
  }

  // ── Block properties (.block-properties) ──────────────────────────────
  /** The block-properties container. Present only when a block is selected. */
  get blockProperties() {
    return this.page.locator(".block-properties");
  }

  /** Property rows inside block-properties. */
  get propRows() {
    return this.page.locator(".prop-row");
  }

  /** Read-only prop-value spans. */
  get propValuesReadonly() {
    return this.page.locator(".prop-value--readonly");
  }

  /** Editable .prop-input fields. */
  get propInputs() {
    return this.page.locator(".prop-input");
  }

  /** Editable .prop-textarea fields. */
  get propTextareas() {
    return this.page.locator(".prop-textarea");
  }

  /** .prop-select dropdowns (Type dropdown for Decision connection). */
  get propSelects() {
    return this.page.locator(".prop-select");
  }

  /** Comments count button inside block properties. */
  get commentsBtn() {
    return this.page.locator(".prop-comments-btn");
  }

  /** Incomplete-path warning banner for Decision blocks. */
  get incompleteWarning() {
    return this.page.locator(".prop-incomplete-warning");
  }

  // ── Comment panel (.comment-panel) ────────────────────────────────────
  /** The comment-panel container. Present only when comment panel is open. */
  get commentPanel() {
    return this.page.locator(".comment-panel");
  }

  /** "No comments yet" empty state message. */
  get commentEmpty() {
    return this.page.locator(".comment-empty");
  }

  /** All comment-item rows in the list. */
  get commentItems() {
    return this.page.locator(".comment-item");
  }

  /** The textarea for adding a new comment. */
  get commentAddInput() {
    return this.page.locator(".comment-add-input");
  }

  /** The "Add Comment" button. */
  get commentAddBtn() {
    return this.page.locator(".comment-add-btn");
  }
}

/**
 * Page Object Model for the Comment Dot indicator on canvas blocks.
 * These are only present when blocks with comments are rendered
 * (requires a loaded DiagramFile).
 */
export class CommentDotPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** All .comment-dot elements currently in the DOM. */
  get all() {
    return this.page.locator(".comment-dot");
  }

  /** A specific comment-dot by its aria-label pattern (uses partial match). */
  byLabel(label: string) {
    return this.page.locator(`.comment-dot[aria-label*="${label}"]`);
  }

  /** .comment-dot-badge elements (numeric badge when count > 1). */
  get badges() {
    return this.page.locator(".comment-dot-badge");
  }
}
