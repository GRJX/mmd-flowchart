import { type Page } from "@playwright/test";
import { AppPage } from "../pages/app.page";

export interface NavigationResult {
  app: AppPage;
  status: number;
}

/**
 * Navigate to the app root and wait for the React root element to attach.
 * Returns the AppPage POM and the HTTP status code.
 */
export async function loadApp(page: Page): Promise<NavigationResult> {
  const app = new AppPage(page);
  const response = await app.goto();
  await app.root.waitFor({ state: "attached" });
  return { app, status: response?.status() ?? 0 };
}

/**
 * Navigate to a path that does not exist in the router.
 * Used to verify the SPA 404 → index.html nginx rewrite.
 */
export async function loadUnknownRoute(page: Page): Promise<NavigationResult> {
  const app = new AppPage(page);
  const response = await app.gotoPath("/this-route-does-not-exist");
  return { app, status: response?.status() ?? 0 };
}
