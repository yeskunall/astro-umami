import { execFile } from "node:child_process";
import { readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { Script } from "node:vm";
import { expect, test } from "@playwright/test";

const execFileAsync = promisify(execFile);
const playgroundDirectory = fileURLToPath(new URL("..", import.meta.url));
const outputDirectory = new URL("../dist/", import.meta.url);

test.describe.configure({ mode: "serial" });

async function buildWithEndpoint(endpointUrl: string): Promise<string> {
  await execFileAsync("pnpm", ["exec", "astro", "build"], {
    cwd: playgroundDirectory,
    env: {
      ...process.env,
      UMAMI_ENDPOINT_URL: endpointUrl,
    },
  });

  return readFile(new URL("index.html", outputDirectory), "utf8");
}

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

test("rejects protocol-relative endpoint URLs", async () => {
  let stderr: string | undefined;

  try {
    await buildWithEndpoint("//analytics.example.com");
  }
  catch (error) {
    stderr = (error as { stderr?: string }).stderr;
  }
  finally {
    await rm(outputDirectory, { force: true, recursive: true });
  }

  expect(stderr).toContain(
    "`endpointUrl` must be an absolute URL or a root-relative path",
  );
});

test("escapes the endpoint URL in the generated inline script", async () => {
  try {
    const html = await buildWithEndpoint(
      String.raw`/_umami";window.__INJECTED__=true;//`,
    );
    const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/u)?.[1];

    if (inlineScript === undefined) {
      throw new Error("Expected the build output to contain an inline script");
    }

    expect(() => new Script(inlineScript)).not.toThrow();
  }
  finally {
    await rm(outputDirectory, { force: true, recursive: true });
  }
});
