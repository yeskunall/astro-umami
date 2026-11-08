import process from "node:process";

// This selects a test fixture, not a public integration environment override.
export const scenario = process.env.PLAYGROUND_SCENARIO ?? "default";

if (scenario !== "default" && scenario !== "umami-enabled") {
  throw new Error(`Unknown playground scenario: ${scenario}`);
}
