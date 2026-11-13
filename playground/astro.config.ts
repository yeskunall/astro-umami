import process from "node:process";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import { createIntegrationWatcher } from "./integrations/watcher";

const scenario = process.env.PLAYGROUND_SCENARIO ?? "default";
const { default: packageName } = await import("@yeskunall/astro-umami");

// https://astro.build/config
export default defineConfig({
  integrations: [
    packageName(scenario === "enabled-in-development"
      ? {
          enabledInDevelopment: true,
          id: "94db1cb1-74f4-4a40-ad6c-962362670409",
        }
      : scenario === "auto-pageview"
        ? {
            autoPageview: false,
            id: "94db1cb1-74f4-4a40-ad6c-962362670409",
          }
        : {
            autotrack: false,
            beforeSendHandler: "beforeSendHandler",
            doNotTrack: true,
            excludeHash: true,
            excludeSearch: true,
            id: "94db1cb1-74f4-4a40-ad6c-962362670409",
            domains: ["example.com", "com.example"],
            hostUrl: "https://analytics.eu.umami.is",
            performance: true,
            salt: "2026-10-30",
            saltRotation: "daily",
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
