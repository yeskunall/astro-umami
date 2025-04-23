import type { AstroIntegration } from "astro";

type OptionalExceptFor<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? T[P] : T[P] | undefined;
} & Pick<T, K>;

interface UmamiOptions {
  /**
   * Umami tracks all events and pageviews for you automatically. Override this behavior if you plan on using [tracker functions](https://umami.is/docs/tracker-functions).
   * @default true
   */
  autotrack?: boolean;
  /**
   * If you want the tracker to only run on specific domains, add them to this list.
   *
   * @example ["mywebsite.com", "mywebsite2.com"]
   */
  domains?: string[];
  /**
   *
   * The endpoint where your Umami instance is located.
   * @default https://cloud.umami.is
   * @example https://umami-on.fly.dev
   */
  endpointUrl?: string;
  /**
   * Override the location where your analytics data is sent.
   */
  hostUrl?: string;
  /**
   * The unique ID of your [website](https://umami.is/docs/add-a-website).
   */
  id: string;
  /**
   * Assign a custom name to the tracker script.
   *
   * @default script.js
   * @see [https://umami.is/docs/environment-variables](https://umami.is/docs/environment-variables)
   */
  trackerScriptName?: string;
}

interface Options extends UmamiOptions {
  /**
   * Serve the tracking script using [Partytown](https://partytown.qwik.dev/).
   *
   * @see [https://docs.astro.build/en/guides/integrations-guide/partytown/](https://docs.astro.build/en/guides/integrations-guide/partytown/)
   */
  withPartytown?: boolean;
}

async function getInjectableWebAnalyticsContent({
  mode,
  options,
}: {
  mode: "development" | "production";
  options: OptionalExceptFor<Options, "id">;
}): Promise<string> {
  const {
    autotrack = true,
    domains = [],
    endpointUrl = "https://cloud.umami.is",
    hostUrl = "https://cloud.umami.is",
    id,
    trackerScriptName = "script.js",
    withPartytown = false,
  } = options;

  const hostname = new URL(endpointUrl).hostname;
  const configAsString = [
    !autotrack ? `script.setAttribute("data-auto-track", "${autotrack}")` : "",
    domains.length > 0
      ? `script.setAttribute("data-domains", "${domains.join(",")}")`
      : "",
    hostUrl !== "https://cloud.umami.is"
      ? `script.setAttribute("data-host-url", "${hostUrl}")`
      : "",
    withPartytown ? `script.setAttribute("type", "text/partytown")` : "",
  ]
    .filter(Boolean)
    .join(";\n");

  if (mode === "development") {
    return `
      localStorage.setItem("umami.disabled", "1");

      var script = document.createElement("script");
      var viewTransitionsEnabled = document.querySelector("meta[name='astro-view-transitions-enabled']")?.content;

      script.setAttribute("src", "https://${hostname}/${trackerScriptName}");
      script.setAttribute("defer", true);
      script.setAttribute("data-website-id", "${id}");
      ${configAsString};

      if (!!viewTransitionsEnabled) {
        script.setAttribute("data-astro-rerun", true);
      }

      var head = document.querySelector("head");
      head.appendChild(script);
    `;
  }

  return `
    (function () {
      var script = document.createElement("script");
      var viewTransitionsEnabled = document.querySelector("meta[name='astro-view-transitions-enabled']")?.content;

      script.setAttribute("src", "https://${hostname}/${trackerScriptName}");
      script.setAttribute("defer", true);
      script.setAttribute("data-website-id", "${id}");
      ${configAsString};

      if (!!viewTransitionsEnabled) {
        script.setAttribute("data-astro-rerun", true);
      }

      var head = document.querySelector("head");
      head.appendChild(script);
    })()
  `;
}

export default function umamiIntegration(options: OptionalExceptFor<Options, "id">): AstroIntegration {
  return {
    name: "@yeskunall/astro-umami",
    hooks: {
      "astro:config:setup": async ({ command, injectScript }) => {
        const script = await getInjectableWebAnalyticsContent({
          mode: command === "dev" ? "development" : "production",
          options,
        });

        injectScript("head-inline", script);
      },
    },
  };
}
