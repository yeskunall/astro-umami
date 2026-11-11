import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

const scenario = process.env.PLAYGROUND_SCENARIO ?? "default";

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
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:4321",
    env: { PLAYGROUND_SCENARIO: scenario },
    reuseExistingServer: false,
  },
  workers: process.env.CI ? 1 : undefined,
});
