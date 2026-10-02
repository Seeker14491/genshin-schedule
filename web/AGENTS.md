# Notes for coding agents

See [README.md](README.md) for how the site is built, checked and deployed.

- This is SvelteKit 3 with Svelte 5 runes. SvelteKit 3 differs from older versions: configuration is passed to the `sveltekit()` plugin in `vite.config.ts` (there is no `svelte.config.js`), `$lib` is replaced by `#lib` imports with file extensions (e.g. `#lib/utils/api.ts`), and `$app/environment` is now `$app/env`. Check the docs at https://svelte.dev/docs/kit/llms.txt when unsure.
- The site is a single-page app (`ssr = false`, adapter-static). There is no server code; everything runs in the browser.
- The look must not change unintentionally. Styles use the Tailwind tokens in `src/app.css`, which reproduce the Chakra UI theme the site used before. `npm run screenshots` compares two builds.
- Users' data must stay compatible with the `sync` server and with what earlier versions stored in the browser: don't rename or reshape config keys (`src/lib/utils/config.ts`), and keep keys the code doesn't know about.
- Every message needs a translation in all 15 languages (see `messages/README.md`).
- Before finishing, run `npm run lint`, `npm run check`, `npm test` and `npm run test:e2e`.
