import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      // images are small static assets, so next/image optimization isn't worth it
      "@next/next/no-img-element": "off",
    },
  },
  {
    // CommonJS is required for the Babel config
    files: ["babel.config.js", "langs/message-id.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
