import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import { createIntegrationWatcher } from "../integrations/watcher";

const { default: packageName } = await import("@yeskunall/astro-umami");

// https://astro.build/config
export default defineConfig({
  integrations: [
    packageName({
      enabledInDevelopment: true,
      id: "94db1cb1-74f4-4a40-ad6c-962362670409",
    }),
    createIntegrationWatcher(
      fileURLToPath(
        new URL("../../packages/astro-umami/dist", import.meta.url),
      ),
    ),
  ],
  server: {
    port: 4322,
  },
});
