import { type Page } from "@playwright/test";

/**
 * Page Object Model for connection-system DOM elements.
 *
 * Most of these are absent until a DiagramFile is loaded (requires a real
 * FileSystemFileHandle). The POM also covers the YNPicker dialog which
 * renders when a connection is dropped from a Decision block.
 */
export class ConnectionPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── S5.1 — Connection handle dots on nodes ──────────────────────────────
  /** All `.conn-handle` elements — only exist when nodes are rendered. */
  get connHandles() {
    return this.page.locator(".conn-handle");
  }

  // ── S5.2 — YNPicker dialog ──────────────────────────────────────────────
  /** Full-screen backdrop overlay that hosts the YNPicker. */
  get ynPickerOverlay() {
    return this.page.locator(".yn-picker-overlay");
  }

  /** The picker dialog card itself. */
  get ynPicker() {
    return this.page.locator(".yn-picker");
  }

  /** "Choose path type" title inside the picker. */
  get ynPickerTitle() {
    return this.page.locator(".yn-picker-title");
  }

  /** ✕ close button in the picker header. */
  get ynPickerClose() {
    return this.page.locator(".yn-picker-close");
  }

  /** Y-path assignment button. */
  get ynPickerBtnY() {
    return this.page.locator(".yn-picker-btn--y");
  }

  /** N-path assignment button. */
  get ynPickerBtnN() {
    return this.page.locator(".yn-picker-btn--n");
  }

  /** Warning text shown when a Y or N path already exists. */
  get ynPickerWarning() {
    return this.page.locator(".yn-picker-warning");
  }

  /** Explicit "Cancel" text button at the bottom of the picker. */
  get ynPickerCancelBtn() {
    return this.page.locator(".yn-picker-cancel-btn");
  }

  // ── S5.3 — Edges & waypoint handles ────────────────────────────────────
  /** All React Flow edge elements — only present when connections exist. */
  get edges() {
    return this.page.locator(".react-flow__edge");
  }

  /** Draggable midpoint handle on a selected or waypointd edge. */
  get edgeWaypointHandles() {
    return this.page.locator(".edge-waypoint-handle");
  }

  /** Y-connection badge labels on edges. */
  get edgeLabelsYes() {
    return this.page.locator(".edge-label--yes");
  }

  /** N-connection badge labels on edges. */
  get edgeLabelsNo() {
    return this.page.locator(".edge-label--no");
  }
}
