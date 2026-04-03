import { defineConfig, devices } from "@playwright/test";

/**
 * Base URL can be overridden for CI or Docker testing:
 *   BASE_URL=http://localhost:3000 npx playwright test   (Docker / production)
 *   BASE_URL=http://localhost:5173 npx playwright test   (Vite dev server)
 */
const BASE_URL = process.env["BASE_URL"] ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: "list",

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
