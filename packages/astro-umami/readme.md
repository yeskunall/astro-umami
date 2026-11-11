# astro-umami

> An [Astro integration](https://docs.astro.build/en/guides/integrations-guide/) to add [Umami Analytics](https://umami.is/) to your website.

[![Ask DeepWiki](https://img.shields.io/badge/Ask-DeepWiki-8B5CF6)](https://deepwiki.com/yeskunall/astro-umami)
[![Greptile: The War on Bugs](https://www.greptile.com/badge.svg)](https://www.greptile.com/?ref=yeskunall/astro-umami)
[![E2E tests](https://github.com/yeskunall/astro-umami/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/yeskunall/astro-umami/actions/workflows/test.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/yeskunall/astro-umami/blob/main/license)
[![npm version](https://badge.fury.io/js/@yeskunall%2Fastro-umami.svg)](https://badge.fury.io/js/@yeskunall%2Fastro-umami)
![monthly downloads](https://img.shields.io/npm/dm/@yeskunall/astro-umami.svg?logo=npm)

## Highlights

- Automatically detects if you’re using [View Transitions](https://docs.astro.build/en/guides/view-transitions/) and adds a [`data-astro-rerun`](https://docs.astro.build/en/guides/view-transitions/#data-astro-rerun) attribute
- Disables events and pageviews during development
- Supports all [configuration](https://docs.umami.is/docs/tracker-configuration) options, unlike [`astro-analytics`](https://github.com/Destiner/astro-analytics)
- Provides inline documentation for all configuration options (thanks to [TypeScript](https://github.com/yeskunall/astro-umami/blob/main/packages/astro-umami/src/index.ts#L10))
- (_Optionally_) Serve the tracking script using [Partytown](https://partytown.qwik.dev/) (v0.0.5 onwards)
- **Actively maintained**
- **Zero dependencies**

## Usage

### Install

Run the following from your project directory and follow the prompts:

```sh
pnpm astro add @yeskunall/astro-umami@0.0.10
```

This will install and make the appropriate changes to your Astro config automatically.

### Manual install

1. Install the required dependencies

```sh
pnpm add @yeskunall/astro-umami@0.0.10
```

2. Add the integration to your Astro config:

```diff
+ import umami from "@yeskunall/astro-umami";

export default defineConfig({
  integrations: [
+    umami({ id: "94db1cb1-74f4-4a40-ad6c-962362670409" }),
  ],
});
```

###### For all configurable options, see the [interface](https://github.com/yeskunall/astro-umami/blob/main/packages/astro-umami/src/index.ts#L10).

### Credentialed collection

By default Umami sends collection requests with `credentials: "omit"`. Set `fetchCredentials` to use a different [`RequestCredentials`](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials) mode:

```diff
 umami({
   id: "94db1cb1-74f4-4a40-ad6c-962362670409",
+  fetchCredentials: "same-origin",
 }),
```

The supported values are `"omit"`, `"same-origin"`, and `"include"`. When the option is left unset, the integration does not emit `data-fetch-credentials` at all, so Umami keeps its own `omit` default, which differs from the browser Fetch default. This is verified against the tracker shipped with Umami v3.4.1; the attribute is read by that release's tracker source even though it is not listed on the tracker configuration page.

This option only affects the main tracker’s collection requests. Umami’s Session Replay and Heatmaps recorder hardcodes `credentials: "omit"`, so this option does not change their requests.

Collecting with credentials across origins requires your Umami server to respond with a specific allowed origin and `Access-Control-Allow-Credentials: true`. A wildcard `Access-Control-Allow-Origin` is incompatible with credentialed requests. Browser SameSite and third-party cookie policies still apply. This option does not configure server CORS and cannot bypass browser restrictions.
