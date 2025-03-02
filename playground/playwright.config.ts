import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
  },
  workers: process.env.CI ? 1 : undefined,
});
