import { expect } from "@playwright/test";
import { type SidebarEmptyPage } from "../pages/sidebar-empty.page";

/**
 * Assert the sidebar is showing the "no directory connected" empty state
 * as required by S3.1: left panel shows label + Open Folder button when
 * no directory handle is set.
 */
export async function assertSidebarEmptyState(
  sidebar: SidebarEmptyPage,
): Promise<void> {
  await expect(sidebar.container).toBeVisible();
  await expect(sidebar.label).toHaveText("Open a folder to get started");
  await expect(sidebar.openFolderBtn).toBeVisible();
}
