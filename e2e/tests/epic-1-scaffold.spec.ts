/**
 * Epic #1 — Project scaffold & Docker setup
 * Functional acceptance tests (Issue #1, Stories #10 and #11)
 *
 * Run against the dev server (default):
 *   npx playwright test
 *
 * Run against the Docker / production container:
 *   BASE_URL=http://localhost:3000 npx playwright test
 */

import { test, expect } from "@playwright/test";
import { loadApp, loadUnknownRoute } from "../steppers/navigation.stepper";
import { assertDomContentLoaded } from "../asserters/performance.asserter";
import { assertSpaFallback } from "../asserters/routing.asserter";

const IS_DOCKER = (process.env["BASE_URL"] ?? "").includes(":3000");

// ---------------------------------------------------------------------------
// AC: App is accessible and loads without error
// ---------------------------------------------------------------------------

test("app loads and returns HTTP 200", async ({ page }) => {
  const { status } = await loadApp(page);
  expect(status).toBe(200);
});

test("app root element mounts in the DOM", async ({ page }) => {
  const { app } = await loadApp(page);
  await expect(app.root).toBeAttached();
});

test("page has a document title", async ({ page }) => {
  await loadApp(page);
  await expect(page).toHaveTitle(/.+/);
});

// ---------------------------------------------------------------------------
// AC: App initial load time ≤ 2 s (measured from DOMContentLoaded)
// ---------------------------------------------------------------------------

test("DOMContentLoaded fires within 2 000 ms", async ({ page }) => {
  await loadApp(page);
  await assertDomContentLoaded(page, 2000);
});

// ---------------------------------------------------------------------------
// AC: SPA routing — all client-side routes serve the app, not a 404 page
// (nginx `try_files $uri $uri/ /index.html` — meaningful on Docker/nginx only)
// ---------------------------------------------------------------------------

test("unknown route serves the app, not an error page", async ({ page }) => {
  test.skip(
    !IS_DOCKER,
    "SPA-routing fallback is an nginx concern — run with BASE_URL=http://localhost:3000",
  );
  const { status, app } = await loadUnknownRoute(page);
  await assertSpaFallback(status, app);
});
