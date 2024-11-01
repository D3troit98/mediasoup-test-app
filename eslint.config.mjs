import globals from "globals";
import tseslint from "typescript-eslint";
import tsParser from "@typescript-eslint/parser";
import pluginJs from "@eslint/js";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";

import js from "@eslint/js";
export default [
  {
    ignores: [
      "node_modules",
      "dist/",
      ".next",
      ".env",
      ".cache",
      "components/ui",
      "build",
      "public/build",
      ".env",
    ], // Update ignore patterns
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReactConfig,
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      ".next/*",
      ".env",
      ".cache",
      "components/ui/*",
    ], // Update ignore patterns
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.es6 },
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: "./",
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "no-console": "warn",
      "no-unused-vars": "warn",
      // "no-undef": "warn",
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-explicit-any": "off"
      // Add any other default rules or settings you need here
    },
  },

  {
    settings: {
      react: {
        version: "detect", // Automatically detects the React version
      },
    },
  },
];
