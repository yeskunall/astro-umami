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
      salt: script?.attributes.getNamedItem("data-salt")?.textContent,
      saltRotation: script?.attributes.getNamedItem("data-salt-rotation")?.textContent,
    };
  });

  expect(attributes.autoPageview).toBe("false");
  // The scenario sets only `autoPageview`, so the other attributes must stay absent.
  expect(attributes.autoTrack).toBeUndefined();
  expect(attributes.salt).toBeUndefined();
  expect(attributes.saltRotation).toBeUndefined();
});
