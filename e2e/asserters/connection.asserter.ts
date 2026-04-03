import { expect } from "@playwright/test";
import { ConnectionPage } from "../pages/connection.page";

/**
 * Asserts the connection system is in its idle / pristine state — nothing
 * connection-related should be visible before a DiagramFile is loaded.
 */
export async function assertConnectionSystemIdleState(
  conn: ConnectionPage,
): Promise<void> {
  await expect(conn.connHandles).toHaveCount(0);
  await expect(conn.ynPickerOverlay).toHaveCount(0);
  await expect(conn.edges).toHaveCount(0);
  await expect(conn.edgeWaypointHandles).toHaveCount(0);
}

/**
 * Asserts the YNPicker dialog is not present in the DOM.
 * Called both on cold load and after any action that should not trigger it.
 */
export async function assertYNPickerAbsent(conn: ConnectionPage): Promise<void> {
  await expect(conn.ynPickerOverlay).toHaveCount(0);
  await expect(conn.ynPicker).toHaveCount(0);
}

/**
 * Asserts the full YNPicker structure when it IS rendered.
 * Requires the picker to already be in the DOM (only used in tests where
 * pendingConnection is populated — manual QA or future injectable fixture).
 */
export async function assertYNPickerStructure(
  conn: ConnectionPage,
  sourceLabel: string,
): Promise<void> {
  await expect(conn.ynPicker).toBeVisible();
  await expect(conn.ynPicker).toHaveAttribute("role", "dialog");
  await expect(conn.ynPicker).toHaveAttribute("aria-modal", "true");
  await expect(conn.ynPicker).toHaveAttribute(
    "aria-label",
    "Choose connection type",
  );
  await expect(conn.ynPickerTitle).toHaveText("Choose path type");
  await expect(conn.ynPickerClose).toBeVisible();
  await expect(conn.ynPickerClose).toHaveAttribute("aria-label", "Cancel");
  await expect(conn.ynPickerBtnY).toBeVisible();
  await expect(conn.ynPickerBtnN).toBeVisible();
  await expect(conn.ynPickerCancelBtn).toBeVisible();
  await expect(conn.page.locator(".yn-picker-hint")).toContainText(sourceLabel);
}
