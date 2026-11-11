import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const playgroundDirectory = join(scriptsDirectory, "..");
const fixtureDirectory = join(playgroundDirectory, "fixtures", "production");
const fixture = JSON.parse(
  readFileSync(join(fixtureDirectory, "variants.json"), "utf8"),
);

for (const variant of fixture.variants) {
  const env = {
    ...process.env,
    FIXTURE_ENDPOINT_URL: fixture.endpointUrl,
    FIXTURE_PORT: String(variant.port),
    FIXTURE_OUT_DIR: `dist-${variant.name}`,
    FIXTURE_WEBSITE_ID: fixture.id,
  };

  if (variant.credentials) {
    env.FIXTURE_FETCH_CREDENTIALS = variant.credentials;
  }
  else {
    delete env.FIXTURE_FETCH_CREDENTIALS;
  }

  console.log(`Building production fixture variant "${variant.name}"...`);

  execFileSync(
    "pnpm",
    ["exec", "astro", "build", "--root", fixtureDirectory],
    {
      cwd: playgroundDirectory,
      env,
      stdio: "inherit",
    },
  );
}
