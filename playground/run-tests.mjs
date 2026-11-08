import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";

const require = createRequire(import.meta.url);
const scenarios = process.env.PLAYGROUND_SCENARIO === undefined
  ? ["default", "umami-enabled"]
  : [process.env.PLAYGROUND_SCENARIO];

// Separate Playwright invocations stop Astro before the next scenario starts.
for (const scenario of scenarios) {
  console.log(`\nRunning playground scenario: ${scenario}`);
  const result = spawnSync(
    process.execPath,
    [require.resolve("@playwright/test/cli"), "test", `tests/${scenario}`, ...process.argv.slice(2)],
    {
      stdio: "inherit",
      env: { ...process.env, PLAYGROUND_SCENARIO: scenario },
    },
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
