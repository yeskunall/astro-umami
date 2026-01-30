import { expect, test } from "@playwright/test";

// These tests verify the relative path / subdirectory feature (Issue #139)
// for users who proxy Umami under a path like /_umami

test.describe("Relative path (subdirectory) support", () => {
  test("`src` is a relative path when endpointUrl starts with /", async ({ page }) => {
    await page.goto("/");

    const src = await page.evaluate(() => {
      return document
        .querySelector<HTMLScriptElement>("script[data-website-id]")
        ?.getAttribute("src");
    });

    // Should be a relative path, NOT an absolute URL
    expect(src).toBe("/_umami/script.js");
    expect(src).not.toContain("https://");
    expect(src).not.toContain("http://");
  });

  test("`data-host-url` is not set by default when using relative path", async ({ page }) => {
    await page.goto("/");

    const hostUrl = await page.evaluate(() => {
      return document
        .querySelector<HTMLScriptElement>("script[data-website-id]")
        ?.getAttribute("data-host-url");
    });

    // Umami defaults to sending data to script origin, so no data-host-url should be set
    expect(hostUrl).toBeNull();
  });

  test("`data-website-id` is correctly set", async ({ page }) => {
    await page.goto("/");

    const websiteId = await page.evaluate(() => {
      return document
        .querySelector<HTMLScriptElement>("script[data-website-id]")
        ?.getAttribute("data-website-id");
    });

    expect(websiteId).toBe("94db1cb1-74f4-4a40-ad6c-962362670409");
  });

  test("script element has defer attribute", async ({ page }) => {
    await page.goto("/");

    const hasDefer = await page.evaluate(() => {
      return document
        .querySelector<HTMLScriptElement>("script[data-website-id]")
        ?.hasAttribute("defer");
    });

    expect(hasDefer).toBe(true);
  });

  test("script successfully loads from mocked relative endpoint", async ({ page }) => {
    let scriptRequested = false;
    let requestedUrl = "";

    // Intercept requests to the relative path
    await page.route("**/_umami/script.js", async (route) => {
      scriptRequested = true;
      requestedUrl = route.request().url();

      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: `window.__UMAMI_TEST_LOADED__ = true;`,
      });
    });

    await page.goto("/");

    // Wait for the script to be requested and executed
    await page.waitForFunction(
      () => (window as unknown as { __UMAMI_TEST_LOADED__?: boolean }).__UMAMI_TEST_LOADED__ === true,
      null,
      { timeout: 5000 },
    );

    expect(scriptRequested).toBe(true);
    // The URL should be using the current host (localhost:4322)
    expect(requestedUrl).toContain("/_umami/script.js");
    expect(requestedUrl).toContain("localhost:4322");
  });

  test("relative path works with current host for multi-domain setups", async ({ page }) => {
    const requests: string[] = [];

    // Track all requests to /_umami
    await page.route("**/_umami/**", async (route) => {
      requests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: `// mock script`,
      });
    });

    await page.goto("/");

    // Give time for any requests to be made
    await page.waitForTimeout(500);

    // Verify requests use the page's host, not a hardcoded domain
    const scriptRequest = requests.find(url => url.includes("script.js"));
    expect(scriptRequest).toBeDefined();
    expect(scriptRequest).toMatch(/^http:\/\/localhost:4322\/_umami\/script\.js/);
  });

  test("no external requests are made to cloud.umami.is", async ({ page }) => {
    const externalRequests: string[] = [];

    // Track any requests to cloud.umami.is
    await page.route("**/*cloud.umami.is*/**", async (route) => {
      externalRequests.push(route.request().url());
      await route.abort();
    });

    // Mock the local endpoint
    await page.route("**/_umami/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: `// mock script`,
      });
    });

    await page.goto("/");
    await page.waitForTimeout(500);

    // No requests should have been made to cloud.umami.is
    expect(externalRequests).toHaveLength(0);
  });
});
