import type { AstroIntegration } from "astro";

type OptionalExceptFor<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? T[P] : T[P] | undefined;
} & Pick<T, K>;

interface UmamiOptions {
  /**
   * Umami tracks all events and pageviews for you automatically. Override this behavior if you plan on using [tracker functions](https://docs.umami.is/docs/tracker-functions).
   *
   @default true
   */
  autotrack?: boolean;
  /**
   * Specify a [function](https://docs.umami.is/docs/tracker-configuration#data-before-send) that will be called before data is sent.
   */
  beforeSendHandler?: string;
  /**
   * If you want the tracker to only run on specific domains, add them to this list.
   *
   * @example ["mywebsite.com", "mywebsite2.com"]
   */
  domains?: string[];
  /**
   * Respect a visitor’s [Do Not Track](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/doNotTrack) browser setting.
   */
  doNotTrack?: boolean;
  /**
   *
   * The URL or root-relative path where your Umami instance is located.
   *
   * @default https://cloud.umami.is
   * @example https://umami-on.fly.dev
   * @example /_umami
   */
  endpointUrl?: string;
  /**
   * Set this if you don’t want to collect the hash value from the URL.
   */
  excludeHash?: boolean;
  /**
   * Set this if you don’t want to collect search parameters from the URL.
   */
  excludeSearch?: boolean;
  /**
   * Override the location where your analytics data is sent.
   */
  hostUrl?: string;
  /**
   * The unique ID of your [website](https://docs.umami.is/docs/add-a-website).
   */
  id: string;
  /**
   * Enable automatic collection of [Core Web Vitals](https://web.dev/articles/vitals) (LCP, INP, CLS, FCP, and TTFB) from your visitors’ browsers.
   *
   * @default false
   * @see [https://docs.umami.is/docs/performance](https://docs.umami.is/docs/performance)
   */
  performance?: boolean;
  /**
   * Group events under a named [tag](https://docs.umami.is/docs/tags) for filtering and A/B testing. Tagged events can be filtered in the dashboard by their tag.
   */
  tag?: string;
  /**
   * Assign a custom name to the tracker script.
   *
   * @default script.js
   * @see [https://docs.umami.is/docs/environment-variables](https://docs.umami.is/docs/environment-variables)
   */
  trackerScriptName?: string;
}

interface Options extends UmamiOptions {
  /**
   * Enable tracking during development. By default, events and pageviews are disabled while running `astro dev`.
   *
   * @default false
   */
  enabledInDevelopment?: boolean;
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
    beforeSendHandler,
    domains = [],
    doNotTrack = false,
    enabledInDevelopment = false,
    endpointUrl = "https://cloud.umami.is",
    excludeHash = false,
    excludeSearch = false,
    hostUrl = "https://cloud.umami.is",
    id,
    performance = false,
    tag,
    trackerScriptName = "script.js",
    withPartytown = false,
  } = options;

  const isRelativeEndpoint = endpointUrl.startsWith("/");
  const scriptSrc = isRelativeEndpoint
    ? `${endpointUrl.replace(/\/+$/, "")}/${trackerScriptName}`
    : `https://${new URL(endpointUrl).hostname}/${trackerScriptName}`;
  const configAsString = [
    !autotrack ? `script.setAttribute("data-auto-track", "${autotrack}")` : "",
    beforeSendHandler ? `script.setAttribute("data-before-send", "${beforeSendHandler}")` : "",
    domains.length > 0
      ? `script.setAttribute("data-domains", "${domains.join(",")}")`
      : "",
    doNotTrack ? `script.setAttribute("data-do-not-track", "${doNotTrack}")` : "",
    excludeHash ? `script.setAttribute("data-exclude-hash", "${excludeHash}")` : "",
    excludeSearch ? `script.setAttribute("data-exclude-search", "${excludeSearch}")` : "",
    hostUrl !== "https://cloud.umami.is"
      ? `script.setAttribute("data-host-url", "${hostUrl}")`
      : "",
    performance ? `script.setAttribute("data-performance", "${performance}")` : "",
    tag ? `script.setAttribute("data-tag", "${tag}")` : "",
    withPartytown ? `script.setAttribute("type", "text/partytown")` : "",
  ]
    .filter(Boolean)
    .join(";\n");

  const commonScript = `
    var script = document.createElement("script");
    var viewTransitionsEnabled = document.querySelector("meta[name='astro-view-transitions-enabled']")?.content;

    script.setAttribute("src", "${scriptSrc}");
    script.setAttribute("defer", true);
    script.setAttribute("data-website-id", "${id}");
    ${configAsString};

    if (!!viewTransitionsEnabled) {
      script.setAttribute("data-astro-rerun", true);
    }

    var head = document.querySelector("head");
    head.appendChild(script);
  `;

  if (mode === "development") {
    if (enabledInDevelopment) {
      return `
        (function () {
          localStorage.removeItem("umami.disabled");

          ${commonScript}
        })()
      `;
    }

    return `
      (function () {
        localStorage.setItem("umami.disabled", "1");

        ${commonScript}
      })()
    `;
  }

  return `
    (function () {
      ${commonScript}
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
