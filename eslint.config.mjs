import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        // Google Apps Script Client-side Global
        google: "readonly",
        // Google Apps Script Server-side Globals
        SpreadsheetApp: "readonly",
        HtmlService: "readonly",
        Logger: "readonly",
        UrlFetchApp: "readonly",
        ScriptApp: "readonly",
        DriveApp: "readonly",
        GmailApp: "readonly"
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error"
    }
  },
];