import { z } from "astro/zod";
import { defineIntegration } from "astro-integration-kit";

import { getInjectableWebAnalyticsContent } from "./lib/umami-analytics.js";

export const integration = defineIntegration({
  name: "@yeskunall/astro-umami",
  optionsSchema: z.object({
    /**
     * Umami tracks all events and pageviews for you automatically. Override this behavior if you plan on using [tracker functions](https://umami.is/docs/tracker-functions).
     * @default true
     */
    autotrack: z.boolean().default(true).optional(),
    /**
     * If you want the tracker to only run on specific domains, add them to this list.
     *
     * @example ["mywebsite.com", "mywebsite2.com"]
     */
    domains: z.array(z.string()).optional(),
    /**
     *
     * The endpoint where your Umami instance is located.
     * @default https://cloud.umami.is
     * @example https://umami-on.fly.dev
     */
    endpointUrl: z.string().url().optional(),
    /**
     * Override the location where your analytics data is sent.
     */
    hostUrl: z.string().url().optional(),
    /**
     * The unique ID of your [website](https://umami.is/docs/add-a-website).
     */
    id: z.string(),
    /**
     * Assign a custom name to the tracker script.
     *
     * @default script.js
     * @see [https://umami.is/docs/environment-variables](https://umami.is/docs/environment-variables)
     */
    trackerScriptName: z.string().default("script.js").optional(),
  }),
  setup({ options: config }) {
    return {
      hooks: {
        "astro:config:setup": async ({ command, injectScript }) => {
          const script = await getInjectableWebAnalyticsContent({
            mode: command === "dev" ? "development" : "production",
            config,
          });

          injectScript("head-inline", script);
        },
      },
    };
  },
});
