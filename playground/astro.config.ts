import { createResolver } from "astro-integration-kit";
import { hmrIntegration } from "astro-integration-kit/dev";
import { defineConfig } from "astro/config";

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
      tag: "test-tag",
      withPartytown: true,
    }),
    hmrIntegration({
      directory: createResolver(import.meta.url).resolve(
        "../packages/astro-umami",
      ),
    }),
  ],
});
