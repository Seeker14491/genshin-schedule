import { defineConfig } from "@playwright/test";

// behavior tests run against a production build. The API is faked in the tests (see tests/api.ts),
// so the build points at an address that is never actually contacted
export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.e2e.ts",
  use: { baseURL: "http://localhost:4174", locale: "en-US", timezoneId: "UTC" },
  webServer: {
    command: "npm run build && npx vite preview --port 4174 --strictPort",
    env: { PUBLIC_API_URL: "http://api.test/api/v1" },
    port: 4174,
    reuseExistingServer: !process.env.CI,
  },
});
