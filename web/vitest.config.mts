import { fileURLToPath } from "node:url";
import { transformAsync } from "@babel/core";
import { defineConfig, Plugin } from "vitest/config";
import { messageIdPattern } from "./langs/message-id.js";

// adds react-intl message IDs like the Babel config does for Next.js
const formatjs: Plugin = {
  name: "formatjs",
  enforce: "pre",
  async transform(code, id) {
    if (!/\.tsx?$/.test(id) || id.includes("node_modules") || !code.includes("defaultMessage")) return;

    const result = await transformAsync(code, {
      filename: id,
      babelrc: false,
      configFile: false,
      parserOpts: { plugins: ["typescript", "jsx"] },
      plugins: [["formatjs", { idInterpolationPattern: messageIdPattern }]],
      sourceMaps: true,
    });

    return result?.code ? { code: result.code, map: result.map } : undefined;
  },
};

export default defineConfig({
  plugins: [formatjs],
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    // tests use fixed time zones via luxon, but make sure the machine's zone doesn't matter
    env: { TZ: "UTC" },
  },
});
