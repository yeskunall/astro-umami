import { expect, test } from "@playwright/test";

test("`autoPageview` disabled", async ({ page }) => {
  await page.route("https://cloud.umami.is/script.js", route => route.fulfill({
    contentType: "application/javascript",
    body: "",
  }));

  await page.goto("/");

  const attributes = await page.evaluate(() => {
    const script = document.querySelector<HTMLScriptElement>("script[data-website-id]");

    return {
      autoPageview: script?.attributes.getNamedItem("data-auto-pageview")?.textContent,
      autoTrack: script?.attributes.getNamedItem("data-auto-track")?.textContent,
    };
  });

  expect(attributes.autoPageview).toBe("false");
  // The scenario sets only `autoPageview`, so `data-auto-track` must stay absent.
  expect(attributes.autoTrack).toBeUndefined();
});
