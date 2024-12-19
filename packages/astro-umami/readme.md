# astro-umami

> An [Astro integration](https://docs.astro.build/en/guides/integrations-guide/) to add [Umami Analytics](https://umami.is/) to your website.

## 🪶 Highlights

- Automatically detects if you’re using [View Transitions](https://docs.astro.build/en/guides/view-transitions/) and adds a [`data-astro-rerun`](https://docs.astro.build/en/guides/view-transitions/#data-astro-rerun) attribute
- Disables events and pageviews during development
- Prevents Google Tag Manager from stripping custom `data-*` attributes
- Supports all [configuration](https://umami.is/docs/tracker-configuration) options, unlike [`astro-analytics`](https://github.com/Destiner/astro-analytics)
- (_Optionally_) Serve the tracking script using [Partytown](https://partytown.builder.io/) (_**planned in an upcoming release**_)
- __Actively maintained (Astro 5 ready)__

## 🛟 Usage

### Install

Enable Umami analytics in your Astro project with the following:

```sh
pnpm astro add @yeskunall/astro-umami
```

This will install `@yeskunall/astro-umami` and make the appropriate changes to your Astro config automatically.

### Manual install

1. Install the required dependencies

```sh
pnpm add @yeskunall/astro-umami
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

###### 📖 For all configurable options, see the exported [interface](https://github.com/yeskunall/astro-umami/blob/main/packages/astro-umami/src/lib/umami-analytics.ts#L5).

---

#### ⚖️ License

[MIT](https://github.com/yeskunall/astro-umami/blob/main/license) © [Kunall Banerjee](https://kunall.dev/)
