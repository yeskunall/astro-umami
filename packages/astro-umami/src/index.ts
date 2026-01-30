import type { AstroIntegration } from "astro";

type OptionalExceptFor<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? T[P] : T[P] | undefined;
} & Pick<T, K>;

interface UmamiOptions {
  /**
   * Umami tracks all events and pageviews for you automatically. Override this behavior if you plan on using [tracker functions](https://umami.is/docs/tracker-functions).
   *
   @default true
   */
  autotrack?: boolean;
  /**
   * Specify a [function](https://umami.is/docs/tracker-configuration#data-before-send) that will be called before data is sent.
   */
  beforeSendHandler?: string;
  /**
   * If you want the tracker to only run on specific domains, add them to this list.
   *
   * @example ["mywebsite.com", "mywebsite2.com"]
   */
  domains?: string[];
  /**
   * Respect a visitor's [Do Not Track](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/doNotTrack) browser setting.
   */
  doNotTrack?: boolean;
  /**
   *
   * The endpoint where your Umami instance is located. Can be a full URL or a relative path.
   *
   * @default https://cloud.umami.is
   * @example https://umami-on.fly.dev
   * @example /_umami (for proxied setups where Umami is served from a subdirectory)
   */
  endpointUrl?: string;
  /**
   * Set this if you don't want to collect the hash value from the URL.
   */
  excludeHash?: boolean;
  /**
   * Set this if you don't want to collect search parameters from the URL.
   */
  excludeSearch?: boolean;
  /**
   * Override the location where your analytics data is sent. Can be a full URL or a relative path.
   * When using a relative path for endpointUrl, this is typically not needed as Umami
   * defaults to sending data to the script's origin.
   */
  hostUrl?: string;
  /**
   * The unique ID of your [website](https://umami.is/docs/add-a-website).
   */
  id: string;
  /**
   * Collect events under a specific tag. These events can be filtered in the dashboard by the specific tag.
   */
  tag?: string;
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

/**
 * Check if a URL string is a relative path (starts with /)
 */
function isRelativePath(url: string): boolean {
  return url.startsWith("/");
}

/**
 * Build the script src URL based on whether the endpoint is relative or absolute
 */
function buildScriptSrc(endpointUrl: string, trackerScriptName: string): string {
  if (isRelativePath(endpointUrl)) {
    // For relative paths, use them directly
    // Ensure no double slashes: normalize the path
    const basePath = endpointUrl.endsWith("/") ? endpointUrl.slice(0, -1) : endpointUrl;
    return `${basePath}/${trackerScriptName}`;
  }

  // For absolute URLs, extract the hostname and build the URL
  const hostname = new URL(endpointUrl).hostname;
  return `https://${hostname}/${trackerScriptName}`;
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
    endpointUrl = "https://cloud.umami.is",
    excludeHash = false,
    excludeSearch = false,
    hostUrl,
    id,
    tag,
    trackerScriptName = "script.js",
    withPartytown = false,
  } = options;

  const scriptSrc = buildScriptSrc(endpointUrl, trackerScriptName);
  const isRelativeEndpoint = isRelativePath(endpointUrl);

  // Determine if we need to set `data-host-url`
  // - For absolute endpoints: set if `hostUrl` differs from default
  // - For relative endpoints: only set if `hostUrl` is explicitly provided
  const shouldSetHostUrl = isRelativeEndpoint
    ? hostUrl !== undefined
    : hostUrl !== undefined && hostUrl !== "https://cloud.umami.is";

  const configAsString = [
    !autotrack ? `script.setAttribute("data-auto-track", "${autotrack}")` : "",
    beforeSendHandler ? `script.setAttribute("data-before-send", "${beforeSendHandler}")` : "",
    domains.length > 0
      ? `script.setAttribute("data-domains", "${domains.join(",")}")`
      : "",
    doNotTrack ? `script.setAttribute("data-do-not-track", "${doNotTrack}")` : "",
    excludeHash ? `script.setAttribute("data-exclude-hash", "${excludeHash}")` : "",
    excludeSearch ? `script.setAttribute("data-exclude-search", "${excludeSearch}")` : "",
    shouldSetHostUrl
      ? `script.setAttribute("data-host-url", "${hostUrl}")`
      : "",
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
