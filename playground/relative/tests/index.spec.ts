import { expect, test } from "@playwright/test";

test("uses the relative endpoint for the tracker script", async ({ page }) => {
  await page.route("**/_umami/script.js", async (route) => {
    await route.fulfill({
      body: "",
      contentType: "application/javascript",
      status: 200,
    });
  });

  await page.goto("/");

  await expect(page.locator("script[data-website-id]")).toHaveAttribute(
    "src",
    "/_umami/script.js",
  );
});

test("omits `data-host-url` for a relative endpoint by default", async ({ page }) => {
  await page.route("**/_umami/script.js", async (route) => {
    await route.fulfill({
      body: "",
      contentType: "application/javascript",
      status: 200,
    });
  });

  await page.goto("/");

  await expect(page.locator("script[data-website-id]")).not.toHaveAttribute(
    "data-host-url",
    /.+/,
  );
});

test("loads the tracker script from the page origin", async ({ page }) => {
  let requestedUrl: string | undefined;

  await page.route("**/_umami/script.js", async (route) => {
    requestedUrl = route.request().url();
    await route.fulfill({
      body: "window.__UMAMI_TEST_LOADED__ = true;",
      contentType: "application/javascript",
      status: 200,
    });
  });

  await page.goto("/");
  await page.waitForFunction(
    () => (window as typeof window & { __UMAMI_TEST_LOADED__?: boolean }).__UMAMI_TEST_LOADED__,
  );

  expect(requestedUrl).toBe("http://localhost:4323/_umami/script.js");
});

test("does not request the Cloud Umami endpoint", async ({ page }) => {
  const cloudRequests: string[] = [];

  page.on("request", (request) => {
    if (request.url().includes("cloud.umami.is")) {
      cloudRequests.push(request.url());
    }
  });

  await page.route("**/_umami/script.js", async (route) => {
    await route.fulfill({
      body: "",
      contentType: "application/javascript",
      status: 200,
    });
  });

  await page.goto("/");

  expect(cloudRequests).toHaveLength(0);
});
