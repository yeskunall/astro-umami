import { expect, test } from "@playwright/test";

test("`enabledInDevelopment` removes `umami.disabled`", async ({ page }) => {
  await page.route("https://cloud.umami.is/script.js", route => route.fulfill({
    contentType: "application/javascript",
    body: "document.documentElement.dataset.disabledAtTrackerExecution = String(localStorage.getItem(\"umami.disabled\"));",
  }));

  await page.addInitScript(() => {
    localStorage.setItem("umami.disabled", "1");
  });

  await page.goto("/");

  const disabled = await page.evaluate(() => localStorage.getItem("umami.disabled"));

  expect(disabled).toBeNull();

  await expect(page.locator("script[data-website-id]")).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("data-disabled-at-tracker-execution", "null");
});
