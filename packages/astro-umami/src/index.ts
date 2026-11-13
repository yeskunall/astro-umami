import type { AstroIntegration } from "astro";

type OptionalExceptFor<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? T[P] : T[P] | undefined;
} & Pick<T, K>;

type SaltRotation = "hourly" | "daily" | "weekly" | "monthly";

const saltRotationValues: SaltRotation[] = ["hourly", "daily", "weekly", "monthly"];

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
   * A value mixed into the server’s session salt. Visitors with different salts get different session IDs, so changing the value starts new sessions. For example, a salt of `2026-10-30` that you change every day rotates sessions daily.
   *
   * The salt is only used when the server sets `ENABLE_CLIENT_SALT`. It adds to the server salt and never replaces it, so it can split sessions further but cannot merge them. When both `salt` and `saltRotation` are set, `salt` wins.
   *
   * @see [https://docs.umami.is/docs/tracker-configuration#data-salt](https://docs.umami.is/docs/tracker-configuration#data-salt)
   */
  salt?: string;
  /**
   * Generates the salt from the current UTC time instead of a fixed value. Accepts `hourly`, `daily`, `weekly`, or `monthly`. Weeks start on Sunday. The salt is recalculated for every request, so a page that stays open still rotates.
   *
   * This setting is ignored when `salt` is set. Like `salt`, it only takes effect when the server sets `ENABLE_CLIENT_SALT`.
   *
   * @see [https://docs.umami.is/docs/tracker-configuration#data-salt-rotation](https://docs.umami.is/docs/tracker-configuration#data-salt-rotation)
   */
  saltRotation?: SaltRotation;
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
    salt,
    saltRotation,
    tag,
    trackerScriptName = "script.js",
    withPartytown = false,
  } = options;

  if (saltRotation !== undefined && !saltRotationValues.includes(saltRotation)) {
    throw new Error(
      `Invalid \`saltRotation\` option: ${JSON.stringify(saltRotation)}. Expected one of ${saltRotationValues.join(", ")}.`,
    );
  }

  const hostname = new URL(endpointUrl).hostname;
  const configAsString = [
    !autotrack ? `script.setAttribute("data-auto-track", "${autotrack}")` : "",
    !autoPageview ? `script.setAttribute("data-auto-pageview", "${autoPageview}")` : "",
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
    salt ? `script.setAttribute("data-salt", ${JSON.stringify(salt).replace(/</g, "\\u003C")})` : "",
    saltRotation ? `script.setAttribute("data-salt-rotation", "${saltRotation}")` : "",
    tag ? `script.setAttribute("data-tag", "${tag}")` : "",
    withPartytown ? `script.setAttribute("type", "text/partytown")` : "",
  ]
    .filter(Boolean)
    .join(";\n");

  const commonScript = `
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
