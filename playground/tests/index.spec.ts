import { expect, test } from "@playwright/test";

// NOTE: Using the `website-id` data attribute because this is the only required
// property as per the docs. In other words, if the script exists on the
// page, then it should be safe to query based on this selector.

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
