import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["dist/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,gs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.googleappsscript,
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error"
    }
  },
];