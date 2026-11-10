import process from "node:process";
import { defineConfig, devices } from "@playwright/test";
import { scenario } from "./scenario";

export default defineConfig({
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chromium" },
    },
  ],
  reporter: [["html", { outputFolder: `playwright-report/${scenario}` }]],
  outputDir: `test-results/${scenario}`,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://localhost:4322",
    trace: "on-first-retry",
  },
  webServer: {
    // Keep the test server separate from a developer's usual port 4321.
    command: "pnpm dev --port 4322",
    url: "http://localhost:4322",
    reuseExistingServer: false,
    env: { PLAYGROUND_SCENARIO: scenario },
  },
  workers: process.env.CI ? 1 : undefined,
});
