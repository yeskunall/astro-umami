import assert from "node:assert/strict";
import { describe, test } from "node:test";

import umamiIntegration from "../src/index.ts";

type Options = Parameters<typeof umamiIntegration>[0];

const ID = "94db1cb1-74f4-4a40-ad6c-962362670409";

async function getBootstrap(
  options: Options,
  command: "dev" | "build" = "build",
): Promise<string> {
  const integration = umamiIntegration(options);
  const setup = integration.hooks["astro:config:setup"];
  assert.ok(setup, "expected an astro:config:setup hook");

  const injected: string[] = [];

  await setup({
    command,
    injectScript: (_stage: string, content: string) => {
      injected.push(content);
    },
  } as never);

  assert.equal(injected.length, 1, "expected exactly one injected script");

  return injected[0] as string;
}

function getFetchCredentialsAttribute(bootstrap: string): string | undefined {
  return bootstrap.match(/data-fetch-credentials", "([^"]+)"/)?.[1];
}

describe("`fetchCredentials` option", () => {
  for (const value of ["omit", "same-origin", "include"] as const) {
    test(`emits \`${value}\``, async () => {
      const bootstrap = await getBootstrap({ id: ID, fetchCredentials: value });

      assert.match(
        bootstrap,
        new RegExp(`script\\.setAttribute\\("data-fetch-credentials", "${value}"\\)`),
      );
      assert.equal(getFetchCredentialsAttribute(bootstrap), value);
    });
  }

  test("omits the attribute when the option is undefined", async () => {
    const bootstrap = await getBootstrap({ id: ID });

    assert.doesNotMatch(bootstrap, /data-fetch-credentials/);
    assert.equal(getFetchCredentialsAttribute(bootstrap), undefined);
  });

  test("omits the attribute in development mode while still disabling tracking", async () => {
    const bootstrap = await getBootstrap({ id: ID }, "dev");

    assert.match(bootstrap, /localStorage\.setItem\("umami\.disabled", "1"\)/);
    assert.doesNotMatch(bootstrap, /data-fetch-credentials/);
  });

  for (const value of [null, "", false, 0, "cross-origin", {}, []]) {
    test(`rejects ${JSON.stringify(value)} at runtime`, async () => {
      assert.doesNotThrow(() => umamiIntegration({ id: ID, fetchCredentials: value as never }));
      await assert.rejects(
        () => getBootstrap({ id: ID, fetchCredentials: value as never }),
        /Invalid `fetchCredentials` option/,
      );
    });
  }
});
