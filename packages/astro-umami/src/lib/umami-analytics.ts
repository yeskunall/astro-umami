type OptionalExceptFor<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? T[P] : T[P] | undefined;
} & Pick<T, K>;

export interface UmamiConfig {
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

export async function getInjectableWebAnalyticsContent({
  mode,
  config,
}: {
  mode: "development" | "production";
  config: OptionalExceptFor<UmamiConfig, "id">;
}): Promise<string> {
  const {
    autotrack = true,
    domains = [],
    endpointUrl = "https://cloud.umami.is",
    hostUrl = "https://cloud.umami.is",
    id,
    trackerScriptName = "script.js",
  } = config;

  const hostname = new URL(endpointUrl).hostname;

  if (mode === "development") {
    return `
      localStorage.setItem("umami.disabled", "1");

      var script = document.createElement("script");
      var viewTransitionsEnabled = document.querySelector("meta[name='astro-view-transitions-enabled']")?.content;

      script.setAttribute("src", "https://${hostname}/${trackerScriptName}");
      script.setAttribute("defer", true);
      script.setAttribute("data-website-id", "${id}");

      ${!autotrack ? `script.setAttribute("data-auto-track", "${autotrack}")` : ""};
      ${domains.length > 0 ? `script.setAttribute("data-domains", "${domains.join(",")}")` : ""};
      ${hostUrl !== "https://cloud.umami.is" ? `script.setAttribute("data-host-url", "${hostUrl}")` : ""};

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

      ${!autotrack ? `script.setAttribute("data-auto-track", "${autotrack}")` : ""};
      ${domains.length > 0 ? `script.setAttribute("data-domains", "${domains.join(",")}")` : ""};
      ${hostUrl !== "https://cloud.umami.is" ? `script.setAttribute("data-host-url", "${hostUrl}")` : ""};

      if (!!viewTransitionsEnabled) {
        script.setAttribute("data-astro-rerun", true);
      }

      var head = document.querySelector("head");
      head.appendChild(script);
    })();
  `;
}
