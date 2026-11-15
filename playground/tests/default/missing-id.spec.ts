import { expect, test } from "@playwright/test";
import umami from "@yeskunall/astro-umami";

async function getScript(command: "dev" | "build") {
  let script = "";
  const integration = umami({} as never);

  await integration.hooks["astro:config:setup"]!({
    command,
    injectScript: (_stage: string, content: string) => {
      script = content;
    },
  } as never);

  return script;
}

test("missing `id` fails the build", async () => {
  await expect(getScript("build")).rejects.toThrow(/`id` option is required/);
});

test("missing `id` throws in the browser in development", async () => {
  const script = await getScript("dev");

  expect(script).toContain("throw new Error");
  expect(script).not.toContain("data-website-id");
});
