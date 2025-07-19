import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import tseslint from "typescript-eslint";

import type { Linter } from "eslint";

const stylisticConfig = stylistic.configs.customize({
  indent: 2,
  quotes: "double",
  semi: true,
});

const stylisticRulesAsWarnings: Record<string, Linter.RuleEntry>
  = Object.entries(stylisticConfig.rules || {}).reduce(
    (acc, [ruleName, ruleConfig]) => {
      if (Array.isArray(ruleConfig)) {
        // Rule has configuration options: ["error", { options }] -> ["warn", { options }]
        acc[ruleName] = ["warn", ...ruleConfig.slice(1)];
      }
      else {
        // Rule is just a severity level: "error" -> "warn"
        acc[ruleName] = "warn";
      }

      return acc;
    },
    {} as Record<string, Linter.RuleEntry>,
  );

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["dist"],
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      ...stylisticRulesAsWarnings,
    },
  },
);
