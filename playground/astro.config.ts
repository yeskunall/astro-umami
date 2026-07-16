import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import { createIntegrationWatcher } from "./integrations/watcher";

const { default: packageName } = await import("@yeskunall/astro-umami");

// https://astro.build/config
export default defineConfig({
  integrations: [
    packageName({
      autotrack: false,
      beforeSendHandler: "beforeSendHandler",
      doNotTrack: true,
      excludeHash: true,
      excludeSearch: true,
      id: "94db1cb1-74f4-4a40-ad6c-962362670409",
      domains: ["example.com", "com.example"],
      hostUrl: "https://analytics.eu.umami.is",
      performance: true,
      tag: "test-tag",
      withPartytown: true,
    }),
    createIntegrationWatcher(
      fileURLToPath(
        new URL("../packages/astro-umami/dist", import.meta.url),
      ),
    ),
  ],
});
