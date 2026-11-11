import { defineConfig } from "astro/config";
import umami from "@yeskunall/astro-umami";

const port = Number(process.env.FIXTURE_PORT ?? 4322);
const id = process.env.FIXTURE_WEBSITE_ID;
const endpointUrl = process.env.FIXTURE_ENDPOINT_URL;
const credentials = process.env.FIXTURE_FETCH_CREDENTIALS;

if (!id || !endpointUrl) {
  throw new Error(
    "FIXTURE_WEBSITE_ID and FIXTURE_ENDPOINT_URL must be set by the fixture build script",
  );
}

export default defineConfig({
  outDir: process.env.FIXTURE_OUT_DIR ?? "dist",
  integrations: [
    umami({
      endpointUrl,
      hostUrl: `http://localhost:${port}`,
      id,
      ...(credentials
        ? { fetchCredentials: credentials as "omit" | "same-origin" | "include" }
        : {}),
    }),
  ],
});
