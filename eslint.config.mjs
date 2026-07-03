import js from "@eslint/js";
import ts from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import eslintConfigPrettier from "eslint-config-prettier";

export default ts.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/postgres_data/**",
      "**/backups/**",
      "**/uploads/**",
      "**/public/**",
      "**/dist/**",
      "**/build/**",
      "**/*.min.js",
      "**/scratch/**",
      "/*.js",
      "*.js",
      "security-audit/**",
      "pentest-results/**",
      "scripts/**",
      "e2e/**",
      "__tests__/**",
      "tests/**",
      "locales/*.js",
      "prisma/*.js",
      "next-env.d.ts",
      "global.d.ts",
      "next.config.mjs"
    ]
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      
      // Turn off rules that are generating warnings/errors in legacy code
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-unused-vars": "off",
      "react/no-unescaped-entities": "off",
      "no-empty": "off",
      "prefer-const": "off",
      "no-case-declarations": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-control-regex": "off",
      "no-useless-escape": "off",
      "no-unsafe-optional-chaining": "off",
      "no-async-promise-executor": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@next/next/no-img-element": "off",
      "prefer-rest-params": "off",
      "@next/next/no-html-link-for-pages": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
    },
  },
  eslintConfigPrettier
);
