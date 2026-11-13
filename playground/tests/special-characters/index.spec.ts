import { expect, test } from "@playwright/test";

// The scenario configures these options with values that break naive
// interpolation into the inline script: a quote, a backslash, a newline, and a
// `</script>` sequence that would otherwise end the script block.
const tag = "spring \"sale\" from C:\\temp\n</script><script>window.umamiBrokeOut = true</script>";
const trackerScriptName = "tracker\".js";

test.beforeEach(async ({ page }) => {
  await page.route("https://cloud.umami.is/**", route => route.fulfill({
    contentType: "application/javascript",
    body: "",
  }));
});

test("`tag` reaches the tracker intact", async ({ page }) => {
  await page.goto("/");

  const attributes = await page.evaluate(() => {
    const script = document.querySelector<HTMLScriptElement>("script[data-website-id]");

    return {
      brokeOut: "umamiBrokeOut" in window,
      tag: script?.attributes.getNamedItem("data-tag")?.textContent,
    };
  });

  expect(attributes.tag).toBe(tag);
  // A `</script>` payload that ended the inline script block would run this.
  expect(attributes.brokeOut).toBe(false);
});

test("`trackerScriptName` reaches the tracker intact", async ({ page }) => {
  await page.goto("/");

  const src = await page.evaluate(() => {
    const script = document.querySelector<HTMLScriptElement>("script[data-website-id]");

    return script?.attributes.getNamedItem("src")?.textContent;
  });

  expect(src).toBe(`https://cloud.umami.is/${trackerScriptName}`);
});
