import { expect } from "@playwright/test";
import { type AppPage } from "../pages/app.page";

/**
 * Assert that an unknown client-side route is handled by the nginx SPA
 * fallback (try_files → index.html) rather than returning a bare 404.
 *
 * Checks:
 *  - HTTP status is 200 (nginx rewrites, not 404)
 *  - React still mounts (#root is attached)
 */
export async function assertSpaFallback(
  status: number,
  app: AppPage,
): Promise<void> {
  expect(status, "nginx SPA fallback must return HTTP 200").toBe(200);
  await expect(app.root).toBeAttached();
}
