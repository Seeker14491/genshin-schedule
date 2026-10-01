# genshin-web

The website, built with [Next.js](https://nextjs.org/) (App Router), [React](https://react.dev/) and [Chakra UI](https://chakra-ui.com/).

### Prerequisites

- [Node.js 22+](https://nodejs.org/) (24 recommended)

## Local development

To start a local development instance at: http://localhost:3000

```shell
# Install dependencies
npm install

# Start next.js dev server
npm run dev
```

Unless `NEXT_PUBLIC_API_PUBLIC` is configured, the official API is used, so you do not need to run PostgreSQL and `sync` locally. To use a local `sync` server instead, create `.env.local`:

```shell
NEXT_PUBLIC_API_PUBLIC=http://localhost:5000/api/v1
```

## Checks

```shell
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm test           # unit tests (Vitest)
npm run format     # format code with Prettier
```

## Production build

To start a production instance at: http://0.0.0.0:3000

```shell
npm ci
npm run build
npm start
```

Pages are rendered on the server for each request, so the site cannot be served by a static file server.

Refer to the [Dockerfile](Dockerfile), which is the production build script. Its build context is the repository root.

## Environment variables

Compile-time variables (they are embedded into the build, so changing them requires rebuilding):

- (optional) `NEXT_PUBLIC_API_PUBLIC` URL of the `sync` server that is accessible from the internet.
- (optional) `NEXT_PUBLIC_API_INTERNAL` URL of the `sync` server that is accessible within the local network. This can be useful when running on Docker because requests will be handled faster. e.g. if the API service is named `genshin-sync`, set as `http://genshin-sync:80/api/v1`. Falls back to `NEXT_PUBLIC_API_PUBLIC` when not specified.

## Project structure

- [app](app) Pages and layouts. Pages under `(app)` require signing in or continuing without signing in.
- [components](components) React components. Most use [Chakra UI](https://chakra-ui.com/docs/components/concepts/overview) for layout and styling.
- [utils](utils) The API client, the user's settings (`config.ts`) and how they are synchronized (`sync.ts`), and time calculations.
- [db](db) Game data, such as the resin cap.
- [langs](langs) Translations. See its [README](langs/README.md).
- [assets](assets) Images and fonts.

## Updating for new game versions

- Resin cap and recharge rate: [db/resins.ts](db/resins.ts)
- Realm currency caps and rates: [db/realms.ts](db/realms.ts)
- Server time zones and reset time: [utils/time.ts](utils/time.ts)

## Translations

Message IDs are generated at compile time by [babel-plugin-formatjs](https://formatjs.github.io/docs/tooling/babel-plugin), which Next.js runs through Babel automatically because of [babel.config.js](babel.config.js). It is pinned to version 11, the last version compatible with the Babel 7 bundled in Next.js.
