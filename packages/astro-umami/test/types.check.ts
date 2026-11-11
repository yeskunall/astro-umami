import umamiIntegration from "../src/index.ts";

type Options = Parameters<typeof umamiIntegration>[0];

export const validFetchCredentials: Options[] = [
  { id: "website-id", fetchCredentials: "omit" },
  { id: "website-id", fetchCredentials: "same-origin" },
  { id: "website-id", fetchCredentials: "include" },
];

export const invalidFetchCredentials: Options = {
  id: "website-id",
  // @ts-expect-error `cross-origin` is not a valid `RequestCredentials` mode for this option.
  fetchCredentials: "cross-origin",
};
