# genshin-web

The website, built with [SvelteKit](https://svelte.dev/docs/kit) and [Tailwind CSS](https://tailwindcss.com/), translated with [Paraglide](https://paraglidejs.com/).

It is a single-page app: the build is plain HTML, JavaScript and CSS files, and everything runs in the browser. Signed-in users' data comes from the [sync](../sync) server's API, and everyone else's is stored in the browser.

### Prerequisites

- [Node.js 22.17+](https://nodejs.org/) (24 recommended)

## Local development

To start a local development instance at: http://localhost:5173

```shell
# Install dependencies
npm install

# Start the development server
npm run dev
```

Unless `PUBLIC_API_URL` is configured, the official API is used, so you do not need to run PostgreSQL and `sync` locally. To use a local `sync` server instead, create `.env.local`:

```shell
PUBLIC_API_URL=http://localhost:5000/api/v1
```

To try the site without real accounts, run `npm run fake-api` and use `PUBLIC_API_URL=http://localhost:5555/api/v1`. The fake API accepts any username and password, except the password `wrong`.

## Checks

```shell
npm run lint       # Prettier and ESLint
npm run check      # TypeScript and Svelte
npm test           # unit tests (Vitest)
npm run test:e2e   # behavior tests in a browser (Playwright), against a fake API
npm run format     # format code with Prettier
```

Before running the behavior tests for the first time, install the browser with `npx playwright install chromium`.

## Production build

```shell
npm ci
npm run build
```

This writes the site to `build`. Any static file server can serve it, as long as paths that aren't files are answered with `build/200.html`, which starts the app.

Refer to the [Dockerfile](Dockerfile), which is the production build script and serves the site with nginx ([nginx.conf](nginx.conf)) on port 3000. Its build context is the repository root.

## Environment variables

Compile-time variables (they are embedded into the build, so changing them requires rebuilding):

- (optional) `PUBLIC_API_URL` URL of the `sync` server's API. Defaults to the official server, `https://genshin-schedule-sync.caprover.seekr.pw/api/v1`.

## Project structure

- [src/routes](src/routes) Pages. Pages under `(app)` require signing in or continuing without signing in.
- [src/lib/components](src/lib/components) Svelte components. [ui](src/lib/components/ui) has the basic building blocks, such as buttons and dialogs.
- [src/lib/session.svelte.ts](src/lib/session.svelte.ts) The user's settings (`config`), and loading and synchronizing them.
- [src/lib/utils](src/lib/utils) The API client, the settings' format, synchronization with the server, and time calculations.
- [src/lib/db](src/lib/db) Game data, such as the resin cap.
- [src/app.css](src/app.css) Colors, text sizes and other design tokens. They match the Chakra UI theme the site was originally built with.
- [messages](messages) Translations. See its [README](messages/README.md).
- [src/lib/assets](src/lib/assets) Images and fonts.
- [scripts](scripts) The fake API, the glossary download, and the screenshot comparison.

## Updating for new game versions

- Resin cap, maximum and recharge rate: [src/lib/db/resin.ts](src/lib/db/resin.ts)
- Realm currency caps and rates: [src/lib/db/realms.ts](src/lib/db/realms.ts)
- Server time zones and reset time: [src/lib/utils/time.ts](src/lib/utils/time.ts)

## Comparing screenshots

[scripts/screenshots.mjs](scripts/screenshots.mjs) takes screenshots of the same pages on two builds of the site, e.g. before and after a change to the design, and highlights the differences. Build both against the fake API, serve them, and run:

```shell
npm run screenshots -- --old http://localhost:3001 --new http://localhost:4173
```

The images are written to `screenshots`.
