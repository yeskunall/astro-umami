// @ts-check
import antfu from "@antfu/eslint-config";

export default antfu({
  isInEditor: false,
  ignores: ["**/.*"],
  stylistic: {
    indent: 2,
    quotes: "double",
    semi: true,
  },
  type: "lib",
  typescript: true,
});
