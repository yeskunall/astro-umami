import type { AstroIntegration } from "astro";

type OptionalExceptFor<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? T[P] : T[P] | undefined;
} & Pick<T, K>;

interface UmamiOptions {
  /**
   * By default, Umami initializes pageview tracking, click tracking, path change detection, and optional features like performance tracking. Set this to `false` only if you want to disable tracker initialization entirely and send data yourself using the [tracker functions](https://docs.umami.is/docs/tracker-functions).
   *
   * @default true
   * @see [https://docs.umami.is/docs/tracker-configuration#data-auto-track](https://docs.umami.is/docs/tracker-configuration#data-auto-track)
   */
  autotrack?: boolean;
  /**
   * Disable automatic pageview tracking while keeping the rest of the tracker initialized. Use this when you want to call `umami.track()` manually but still keep features like performance tracking enabled.
   *
   * @default true
   * @see [https://docs.umami.is/docs/tracker-configuration#data-auto-pageview](https://docs.umami.is/docs/tracker-configuration#data-auto-pageview)
   */
  autoPageview?: boolean;
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
   * The endpoint where your Umami instance is located.
   *
   * @default https://cloud.umami.is
   * @example https://umami-on.fly.dev
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
   * Enable tracking during development. This has no effect in production.
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

// Serialize values before interpolating them into the inline script so quotes,
// newlines, and `</script>` sequences cannot break the emitted JavaScript.
const jsString = (value: string) => JSON.stringify(value).replace(/</g, "\\u003C");

async function getInjectableWebAnalyticsContent({
  mode,
  options,
}: {
  mode: "development" | "production";
  options: OptionalExceptFor<Options, "id">;
}): Promise<string> {
  const {
    autotrack = true,
    autoPageview = true,
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

  const hostname = new URL(endpointUrl).hostname;
  const src = `https://${hostname}/${trackerScriptName}`;
  const configAsString = [
    !autotrack ? `script.setAttribute("data-auto-track", "${autotrack}")` : "",
    !autoPageview ? `script.setAttribute("data-auto-pageview", "${autoPageview}")` : "",
    beforeSendHandler ? `script.setAttribute("data-before-send", ${jsString(beforeSendHandler)})` : "",
    domains.length > 0
      ? `script.setAttribute("data-domains", ${jsString(domains.join(","))})`
      : "",
    doNotTrack ? `script.setAttribute("data-do-not-track", "${doNotTrack}")` : "",
    excludeHash ? `script.setAttribute("data-exclude-hash", "${excludeHash}")` : "",
    excludeSearch ? `script.setAttribute("data-exclude-search", "${excludeSearch}")` : "",
    hostUrl !== "https://cloud.umami.is"
      ? `script.setAttribute("data-host-url", ${jsString(hostUrl)})`
      : "",
    performance ? `script.setAttribute("data-performance", "${performance}")` : "",
    tag ? `script.setAttribute("data-tag", ${jsString(tag)})` : "",
    withPartytown ? `script.setAttribute("type", "text/partytown")` : "",
  ]
    .filter(Boolean)
    .join(";\n");

  const commonScript = `
    var script = document.createElement("script");
    var viewTransitionsEnabled = document.querySelector("meta[name='astro-view-transitions-enabled']")?.content;

    script.setAttribute("src", ${jsString(src)});
    script.setAttribute("defer", true);
    script.setAttribute("data-website-id", ${jsString(id)});
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
