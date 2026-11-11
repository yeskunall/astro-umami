import { readFileSync } from "node:fs";
import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

const fixture = JSON.parse(
  readFileSync(
    new URL("./fixtures/production/variants.json", import.meta.url),
    "utf8",
  ),
) as { variants: { port: number }[] };

const readinessVariant = fixture.variants[0];

if (!readinessVariant) {
  throw new Error("Expected at least one production fixture variant");
}

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chromium" },
    },
  ],
  reporter: "html",
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "pnpm dev",
      url: "http://localhost:4321",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm fixture:start",
      url: `http://localhost:${readinessVariant.port}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
  workers: process.env.CI ? 1 : undefined,
});
