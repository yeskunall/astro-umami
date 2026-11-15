import { expect, test } from "@playwright/test";
import umami from "@yeskunall/astro-umami";

// NOTE: All tests query using the `website-id` data attribute because this is
// the only required property as per the docs. In other words, if the script
// exists on the page, then it should be safe to query based on this selector.

// The scenario configures `tag` with a value that breaks naive interpolation
// into the inline script: a quote, a backslash, a newline, and a `</script>`
// sequence that would otherwise end the script block.
const tag = "spring \"sale\" from C:\\temp\n</script><script>window.umamiBrokeOut = true</script>";

async function getScript(
  options: Parameters<typeof umami>[0],
  command: "dev" | "build" = "build",
) {
  let script = "";
  const integration = umami(options);

  await integration.hooks["astro:config:setup"]!({
    command,
    injectScript: (_stage: string, content: string) => {
      script = content;
    },
  } as never);

  return script;
}

test("`umami.disabled` is set by default in development", async ({ page }) => {
  await page.goto("/");

  const disabled = await page.evaluate(() => localStorage.getItem("umami.disabled"));

  expect(disabled).toBe("1");
});

test("`autotrack` disabled", async ({ page }) => {
  await page.goto("/");

  const src = await page.evaluate(
    async () => {
      const autotrack = document
        .querySelector<HTMLScriptElement>(("script[data-website-id]"))
        ?.attributes
        .getNamedItem("data-auto-track")
        ?.textContent;

      return autotrack;
    },
  );

  expect(src).toBe("false");
});

test("`beforeSendHandler` is valid", async ({ page }) => {
  await page.goto("/");

  const src = await page.evaluate(
    async () => {
      const beforeSendHandler = document
        .querySelector<HTMLScriptElement>(("script[data-website-id]"))
        ?.attributes
        .getNamedItem("data-before-send")
        ?.textContent;

      return beforeSendHandler;
    },
  );

  expect(src).toBe("beforeSendHandler");
});

test("`doNotTrack` enabled", async ({ page }) => {
  await page.goto("/");

  const src = await page.evaluate(
    async () => {
      const dnt = document
        .querySelector<HTMLScriptElement>(("script[data-website-id]"))
        ?.attributes
        .getNamedItem("data-do-not-track")
        ?.textContent;

      return dnt;
    },
  );

  expect(src).toBe("true");
});

test("`excludeHash` enabled", async ({ page }) => {
  await page.goto("/");

  const src = await page.evaluate(
    async () => {
      const excludeHash = document
        .querySelector<HTMLScriptElement>(("script[data-website-id]"))
        ?.attributes
        .getNamedItem("data-exclude-hash")
        ?.textContent;

      return excludeHash;
    },
  );

  expect(src).toBe("true");
});

test("`excludeSearch` enabled", async ({ page }) => {
  await page.goto("/");

  const src = await page.evaluate(
    async () => {
      const excludeSearch = document
        .querySelector<HTMLScriptElement>(("script[data-website-id]"))
        ?.attributes
        .getNamedItem("data-exclude-search")
        ?.textContent;

      return excludeSearch;
    },
  );

  expect(src).toBe("true");
});

test("`src` matches", async ({ page }) => {
  await page.goto("/");

  const src = await page.evaluate(
    async () => {
      const src = document
        .querySelector<HTMLScriptElement>(("script[data-website-id]"))
        ?.attributes
        .getNamedItem("src")
        ?.textContent;

      return src;
    },
  );

  expect(src).toBe("https://cloud.umami.is/script.js");
});

test("`trackerScriptName` is escaped in the `src` URL", async () => {
  const script = await getScript({
    id: "94db1cb1-74f4-4a40-ad6c-962362670409",
    trackerScriptName: "tracker\".js",
  });

  expect(() => new Function(script)).not.toThrow();
  expect(script).toContain(`script.setAttribute("src", "https://cloud.umami.is/tracker\\".js");`);
});

test("`id` matches", async ({ page }) => {
  await page.goto("/");

  const id = await page.evaluate(
    async () => {
      const id = document
        .querySelector<HTMLScriptElement>(("script[data-website-id]"))
        ?.attributes
        .getNamedItem("data-website-id")
        ?.textContent;

      return id;
    },
  );

  expect(id).toBe("94db1cb1-74f4-4a40-ad6c-962362670409");
});

test("missing `id` fails the build", async () => {
  await expect(getScript({} as never)).rejects.toThrow(/`id` option is required/);
});

test("missing `id` throws in the browser in development", async () => {
  const script = await getScript({} as never, "dev");

  expect(script).toContain("throw new Error");
  expect(script).not.toContain("data-website-id");
});

test("`domains` match", async ({ page }) => {
  await page.goto("/");

  const domains = await page.evaluate(
    async () => {
      const domains = document
        .querySelector<HTMLScriptElement>(("script[data-website-id]"))
        ?.attributes
        .getNamedItem("data-domains")
        ?.textContent;

      return domains;
    },
  );

  expect(domains).toBe("example.com,com.example");
});

test("`hostUrl` matches", async ({ page }) => {
  await page.goto("/");

  const hostUrl = await page.evaluate(
    async () => {
      const hostUrl = document
        .querySelector<HTMLScriptElement>(("script[data-website-id]"))
        ?.attributes
        .getNamedItem("data-host-url")
        ?.textContent;

      return hostUrl;
    },
  );

  expect(hostUrl).toBe("https://analytics.eu.umami.is");
});

test("`performance` enabled", async ({ page }) => {
  await page.goto("/");

  const performance = await page.evaluate(
    async () => {
      const performance = document
        .querySelector<HTMLScriptElement>(("script[data-website-id]"))
        ?.attributes
        .getNamedItem("data-performance")
        ?.textContent;

      return performance;
    },
  );

  expect(performance).toBe("true");
});

test("`tag` matches", async ({ page }) => {
  await page.goto("/");

  const attributes = await page.evaluate(() => {
    const script = document.querySelector<HTMLScriptElement>("script[data-website-id]");

    return {
      brokeOut: "umamiBrokeOut" in window,
      tag: script?.attributes.getNamedItem("data-tag")?.textContent,
    };
  });

  // The scenario sets a `tag` containing a quote, a backslash, a newline, and a
  // `</script>` payload, so this also fails if the injected script stops
  // escaping the value.
  expect(attributes.tag).toBe(tag);
  // A `</script>` payload that ended the inline script block would run this.
  expect(attributes.brokeOut).toBe(false);
});

test("`withPartytown` enabled", async ({ page }) => {
  await page.goto("/");

  const hostUrl = await page.evaluate(
    async () => {
      const hostUrl = document
        .querySelector<HTMLScriptElement>(("script[data-website-id]"))
        ?.attributes
        .getNamedItem("type")
        ?.textContent;

      return hostUrl;
    },
  );

  expect(hostUrl).toBe("text/partytown");
});
