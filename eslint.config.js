// @ts-check
import antfu from "@antfu/eslint-config";

export default antfu(
  {
    ignores: [
      "**/.*",
      "**/*.d.ts",
      ".astro",
      ".editorconfig",
      ".github",
      ".vscode",
    ],
    stylistic: {
      indent: 2,
      quotes: "double",
      semi: true,
    },
    type: "lib",
    typescript: true,
  },
);
