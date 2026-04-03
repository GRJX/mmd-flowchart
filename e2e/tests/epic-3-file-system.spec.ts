/**
 * Epic #3 — File system & directory management
 * Functional acceptance tests (Issue #3, Stories #15–#19)
 *
 * ──────────────────────────────────────────────────────────────────────────
 * SCOPE NOTE
 * Stories S3.1–S3.4 rely on the File System Access API
 * (showDirectoryPicker, FileSystemFileHandle, FileSystemDirectoryHandle) and
 * on actual files on disk. These native OS-level interactions cannot be driven
 * by a headless browser, so those flows are marked explicitly as out-of-scope
 * for automated e2e tests and must be covered by manual QA.
 *
 * What IS tested here:
 *   S3.1 — sidebar empty-state UI (no directory connected)
 *   S3.5 — New Diagram dialog: structure, validation, cancel, accessibility
 * ──────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from "@playwright/test";
import { loadApp } from "../steppers/navigation.stepper";
import { SidebarEmptyPage } from "../pages/sidebar-empty.page";
import { ToolbarPage } from "../pages/toolbar.page";
import { assertSidebarEmptyState } from "../asserters/sidebar.asserter";
import {
  openNewDiagramDialog,
  cancelNewDiagramDialog,
} from "../steppers/new-diagram-dialog.stepper";

// ── S3.1 — Open folder: sidebar empty state ───────────────────────────────

test.describe("S3.1 — Sidebar empty state (no directory connected)", () => {
  test("sidebar shows 'Open a folder to get started' on initial load", async ({
    page,
  }) => {
    await loadApp(page);
    const sidebar = new SidebarEmptyPage(page);
    await assertSidebarEmptyState(sidebar);
  });

  test("sidebar Open Folder button is visible and enabled", async ({
    page,
  }) => {
    await loadApp(page);
    const sidebar = new SidebarEmptyPage(page);
    await expect(sidebar.openFolderBtn).toBeVisible();
    await expect(sidebar.openFolderBtn).toBeEnabled();
  });

  test("toolbar Open Folder button is visible and enabled", async ({
    page,
  }) => {
    await loadApp(page);
    const tb = new ToolbarPage(page);
    await expect(tb.openFolder).toBeVisible();
    await expect(tb.openFolder).toBeEnabled();
  });
});

// ── S3.5 — New Diagram dialog: structure & validation ─────────────────────

test.describe("S3.5 — New Diagram dialog", () => {
  test("New Diagram toolbar button opens the dialog", async ({ page }) => {
    await loadApp(page);
    const { dialog } = await openNewDiagramDialog(page);
    await expect(dialog.overlay).toBeVisible();
  });

  test("dialog has role='dialog' and aria-label='New Diagram'", async ({
    page,
  }) => {
    await loadApp(page);
    const { dialog } = await openNewDiagramDialog(page);
    await expect(dialog.dialog).toBeVisible();
  });

  test("dialog title reads 'New Diagram'", async ({ page }) => {
    await loadApp(page);
    const { dialog } = await openNewDiagramDialog(page);
    await expect(dialog.title).toHaveText("New Diagram");
  });

  test("dialog shows 'Filename:' label linked to input", async ({ page }) => {
    await loadApp(page);
    const { dialog } = await openNewDiagramDialog(page);
    await expect(dialog.filenameLabel).toBeVisible();
    await expect(dialog.filenameLabel).toHaveText("Filename:");
  });

  test("filename input is present, focused, and empty on open", async ({
    page,
  }) => {
    await loadApp(page);
    const { dialog } = await openNewDiagramDialog(page);
    await expect(dialog.filenameInput).toBeVisible();
    await expect(dialog.filenameInput).toBeFocused();
    await expect(dialog.filenameInput).toHaveValue("");
  });

  test("dialog shows '.mmd extension added automatically' hint", async ({
    page,
  }) => {
    await loadApp(page);
    const { dialog } = await openNewDiagramDialog(page);
    await expect(dialog.hint).toContainText(".mmd");
  });

  test("Create button is disabled when input is empty", async ({ page }) => {
    await loadApp(page);
    const { dialog } = await openNewDiagramDialog(page);
    await expect(dialog.createBtn).toBeDisabled();
  });

  test("Create button becomes enabled when a filename is typed", async ({
    page,
  }) => {
    await loadApp(page);
    const { dialog } = await openNewDiagramDialog(page);
    await dialog.filenameInput.fill("my-diagram");
    await expect(dialog.createBtn).toBeEnabled();
  });

  test("Create button reverts to disabled when input is cleared", async ({
    page,
  }) => {
    await loadApp(page);
    const { dialog } = await openNewDiagramDialog(page);
    await dialog.filenameInput.fill("my-diagram");
    await dialog.filenameInput.clear();
    await expect(dialog.createBtn).toBeDisabled();
  });

  test("Cancel button dismisses the dialog", async ({ page }) => {
    await loadApp(page);
    await cancelNewDiagramDialog(page);
    await expect(page.locator(".dialog-overlay")).not.toBeVisible();
  });
});
