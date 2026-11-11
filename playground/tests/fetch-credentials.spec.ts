import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const fixture = JSON.parse(
  readFileSync(
    new URL("../fixtures/production/variants.json", import.meta.url),
    "utf8",
  ),
) as {
  id: string;
  endpointUrl: string;
  variants: {
    name: string;
    port: number;
    credentials: "omit" | "same-origin" | "include" | null;
  }[];
};

const scriptUrl = new URL("script.js", fixture.endpointUrl).href;

const trackerScript = readFileSync(
  new URL("../fixtures/production/tracker/script.js", import.meta.url),
  "utf8",
);

const eventName = "fetch-credentials-test";

declare global {
  interface Window {
    __umamiCollectionRequests?: {
      credentials: string;
      body: string | null;
    }[];
    umami?: {
      track: (name: string) => Promise<void>;
    };
  }
}

for (const variant of fixture.variants) {
  const origin = `http://localhost:${variant.port}`;
  const collectionUrl = `${origin}/api/send`;
  const expectedCredentials = variant.credentials ?? "omit";

  test.describe(`\`fetchCredentials\`: ${variant.name}`, () => {
    test.use({ baseURL: origin });

    test("real tracker uses the configured credentials mode", async ({ page }) => {
      const collectedEvents: string[] = [];

      await page.addInitScript(() => {
        const originalFetch = window.fetch;

        window.__umamiCollectionRequests = [];
        window.fetch = (input, init) => {
          const url
            = typeof input === "string"
              ? input
              : input instanceof URL
                ? input.href
                : input.url;

          if (url.includes("/api/send")) {
            window.__umamiCollectionRequests?.push({
              credentials: init?.credentials ?? "same-origin",
              body: typeof init?.body === "string" ? init.body : null,
            });
          }

          return originalFetch.call(window, input, init);
        };
      });

      await page.route(scriptUrl, async (route) => {
        await route.fulfill({
          body: trackerScript,
          contentType: "text/javascript; charset=utf-8",
        });
      });

      await page.route(collectionUrl, async (route) => {
        const body = route.request().postDataJSON() as {
          payload?: { name?: string };
          type?: string;
        };

        if (body.payload?.name) {
          collectedEvents.push(body.payload.name);
        }

        await route.fulfill({
          body: "{}",
          contentType: "application/json; charset=utf-8",
        });
      });

      await page.goto("/");

      const script = page.locator("script[data-website-id]");
      await expect(script).toHaveCount(1);
      await expect(script).toHaveAttribute("data-website-id", fixture.id);
      await expect(script).toHaveAttribute("src", scriptUrl);

      if (variant.credentials) {
        await expect(script).toHaveAttribute(
          "data-fetch-credentials",
          variant.credentials,
        );
      }
      else {
        await expect(script).not.toHaveAttribute("data-fetch-credentials");
      }

      expect(
        await page.evaluate(() => window.localStorage.getItem("umami.disabled")),
      ).toBeNull();

      await page.waitForFunction(() => typeof window.umami?.track === "function");
      await page.evaluate((name) => {
        const tracker = window.umami;
        if (!tracker) {
          throw new Error("Umami tracker is not available");
        }

        return tracker.track(name);
      }, eventName);

      await expect
        .poll(
          () =>
            page.evaluate(
              event =>
                window.__umamiCollectionRequests?.find((request) => {
                  try {
                    return (
                      JSON.parse(request.body ?? "")?.payload?.name === event
                    );
                  }
                  catch {
                    return false;
                  }
                }),
              eventName,
            ),
          { message: "expected the tracker to send the test event" },
        )
        .toBeTruthy();

      const record = await page.evaluate(
        event =>
          window.__umamiCollectionRequests?.find((request) => {
            try {
              return JSON.parse(request.body ?? "")?.payload?.name === event;
            }
            catch {
              return false;
            }
          }),
        eventName,
      );

      expect(record).toBeTruthy();
      expect(record?.credentials).toBe(expectedCredentials);
      expect(JSON.parse(record?.body ?? "").payload.website).toBe(fixture.id);
      expect(collectedEvents).toContain(eventName);
    });
  });
}
