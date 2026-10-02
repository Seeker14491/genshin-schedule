import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        // force runes mode for the project, except for libraries. Can be removed in Svelte 6
        runes: ({ filename }) => (filename.split(/[/\\]/).includes("node_modules") ? undefined : true),
      },
      // the site is a single-page app: nginx serves 200.html for every path that isn't a file
      adapter: adapter({ fallback: "200.html" }),
    }),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/lib/paraglide",
      emitTsDeclarations: true,
      // the locale is chosen by the app (see src/lib/i18n.svelte.ts), not by the URL or a cookie
      strategy: ["globalVariable", "baseLocale"],
    }),
  ],
  server: {
    // allows sharing the dev server through temporary Cloudflare tunnels
    allowedHosts: [".trycloudflare.com"],
  },
  test: {
    expect: { requireAssertions: true },
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    environment: "node",
    // tests use fixed time zones via luxon, but make sure the machine's zone doesn't matter
    env: { TZ: "UTC" },
  },
});
