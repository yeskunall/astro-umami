import { expect, test } from "@playwright/test";

test("`enabledInDevelopment` removes `umami.disabled`", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("umami.disabled", "1");
  });

  await page.goto("/");

  const disabled = await page.evaluate(() => localStorage.getItem("umami.disabled"));

  expect(disabled).toBeNull();

  await expect(page.locator("script[data-website-id]")).toHaveCount(1);
});
