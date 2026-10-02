# Rewrite `web` in SvelteKit — design

Date: 2026-10-02
Branch: `sveltekit`

## Goal

Replace the Next.js 16 / React 19 / Chakra UI v3 frontend in `web/` with SvelteKit (Svelte 5) and Tailwind CSS v4, because the maintainer works in Svelte rather than React. The site must look the same as today. A few features are removed, and translations are redone in the game's 15 languages.

The `sync` backend is not changed.

## Scope

### Kept

| Area | Feature |
|---|---|
| Home | Server clock: time on the selected server, weekday, time until daily reset and resin gained by then. Clicking the server name cycles through servers (the only server picker). |
| Home | Resin calculator: editable resin count out of the cap, recharging over time, "full" notice. |
| Home | Resin +/− buttons (configurable list, default −40 −30 −20 −10 +10). Hidden until the section is hovered or focused, and always visible when the device has a touch screen (`any-pointer: coarse`). Buttons that would go below 0 or above the cap are left out. The realm currency "Clear" button follows the same hover rule. |
| Home | Two estimate views ("time steps" and "value steps"), switched by clicking the resin icon or in settings. |
| Home | "Notification at X in …" line, shown when the threshold is below the cap and not yet reached. Links to `/home/notifications`. |
| Home | Realm currency calculator (adeptal energy, trust rank, currency, estimates, clear button). |
| Home | Collapsible sections, with the collapsed state saved in `hiddenWidgets`. Realm currency is collapsed by default. |
| Site | Character backgrounds: faint art in the bottom-right corner, 9 characters or none. |
| Notifications | Discord setup page: steps with screenshots, bot invite link, and the copyable `enable ||<token>||` message. |
| Notifications | Automatic queueing of the resin notification for signed-in users (see [Discord notifications](#discord-notifications)). |
| Settings | Dark mode, language, background, estimate view, resin button list, notification threshold slider (10–cap, step 10). |
| Settings | Manage data: shows the config as JSON to copy, or paste to overwrite. **Changed:** pasted data is validated before it is saved. It must be a JSON object, and every config key it contains must have a value of the right type (e.g. `resin` is `{ value: number, time: number }`, `server` is one of the four servers). Unknown keys are allowed and kept. Invalid data shows an error and changes nothing. |
| Settings | Manage account: change username and password, shows the linked Discord ID. |
| Settings | Sign out. |
| Welcome | Landing page (intro, feature blurb, screenshot, GitHub button), sign in / sign up with username and password (unknown usernames create an account), continue without signing in. |
| Site | Header with links to notifications and settings; footer with disclaimer, credits, shortcuts button and GitHub link. |
| Site | Keyboard shortcuts: digit keys subtract the matching resin button (e.g. `2` → −20), Shift+digit adds, `K` shows the shortcut list. Ignored while typing in a field or with Ctrl/Alt/Meta held. |
| Site | Thin loading bar at the top of the page. |
| Site | Install as an app: `site.webmanifest`, icons, and the no-op `/sw.js`. |
| Site | Analytics script (`https://bing.seekr.pw/chilling.js`, website ID `c976809c-8201-40e1-bed0-238345a7635f`), production builds only. |

### Removed

| Feature | Notes |
|---|---|
| Statistics page (`/home/statistics`) and daily resin tracking | Resin buttons and edits no longer record resin spent. The `stats` and `statRetention` fields stay in users' data (see [Saved data](#saved-data)). The header icon goes away, and the `victory` chart library with it. |
| Notification queue page (`/home/notifications/queue`) | The link icon on the setup page goes away. |
| Admin page (`/home/admin`, "direct sign in") | |
| Help links | Header and footer links to the archived `chiyadev/genshin-schedule` wiki. |
| "Add new language" option in the language picker | |
| Norwegian (`nb-NO`) | Not one of the game's languages. |

The backend endpoints that only the removed features used (`GET notifications`, `GET users/{username}/auth`) stay in `sync` and are simply no longer called.

## Architecture and hosting

- **SvelteKit with `@sveltejs/adapter-static` and server rendering turned off** (`ssr = false` in the root layout). The build outputs plain HTML, JS and CSS, and the whole app runs in the browser.
- **nginx serves the build** in a Docker container on **port 3000**, so the CapRover app (`genshin.seekr.pw`) and `captain-definition-web` don't change. The Dockerfile has a Node build stage and an `nginx:alpine` runtime stage, and its build context is still the repository root.
- **nginx config** (`web/nginx.conf`):
  - Unknown paths fall back to the app's HTML so that reloading `/home` or `/settings` works.
  - `/_app/immutable/` (files with content hashes in their names) is cached for a year as immutable. HTML is served with `Cache-Control: no-cache`.
  - gzip compression for text assets.
  - Permanent redirects for removed pages: `/home/statistics` → `/home`, `/home/admin` → `/home`, `/home/notifications/queue` → `/home/notifications`.
- **API URL** is one build-time variable, `PUBLIC_API_URL`, defaulting to `https://genshin-schedule-sync.caprover.seekr.pw/api/v1`. `NEXT_PUBLIC_API_PUBLIC` and `NEXT_PUBLIC_API_INTERNAL` are removed.
- The site must stay on the `genshin.seekr.pw` origin, because signed-out users' data is in that origin's `localStorage`.

### Pages

| URL | Page | Access |
|---|---|---|
| `/` | Welcome and sign-in | Visitors without the `token` cookie. Others are sent to `/home`. |
| `/home` | Clock, resin calculator, realm currency | Requires the `token` cookie (signed in or "continue without signing in"). |
| `/home/notifications` | Discord setup | Same as `/home`. |
| `/settings` | Settings | Same as `/home`. |
| `/sign-out` | Clears the `token` cookie and goes to `/` | Anyone |

### Startup

1. **Theme before first paint.** An inline script in `app.html` reads `localStorage["color-mode"]` (`"light"` or `"dark"`, already written by today's site through `next-themes`) and sets the `dark` class on `<html>` before anything draws.
2. **Login check.** The root layout reads the `token` cookie:
   - No cookie on a page that requires it → go to `/`.
   - `token` is `"null"` (continued without signing in) → build the config from `localStorage` synchronously and render.
   - Any other `token` → show the loading bar and render only the header and footer frame until `GET sync` returns, then render the page and start sync. A `401` response signs the user out (same as `/sign-out`). Other errors show an error message with a retry button.
3. **Sign-out** happens entirely in the browser: delete the cookie, then go to `/`.

## Data and compatibility

### Code carried over

These modules don't depend on React today and move across with their tests, changing only imports and React types:

- `utils/api.ts`: API client and types.
- `utils/sync.ts`: `ConfigSync`. Changes are debounced (200 ms) and sent as RFC 6902 JSON patches against the last data the server is known to have. Requests go one at a time. When another device changed the data, the server's data replaces local changes.
- `db/resins.ts`, `db/realms.ts`: caps, rates, recharge math.
- `utils/time.ts`: server time zones, reset hour and duration formatting, minus the React hook.
- `utils/config.ts`: `Config` type, defaults and `ConfigStore` (`get`/`set`/`subscribe`), minus the React context and hooks.

### Settings store

- `ConfigStore` stays a plain class so that `ConfigSync` and the `localStorage` code keep working unchanged.
- A thin Svelte 5 wrapper exposes it reactively: components read `config.resin` and update by assigning, e.g. `config.resin = { value, time }`. Every write goes through `ConfigStore.set` so that subscribers (sync, `localStorage`, theme) are notified.
- The store is created once at startup, from `localStorage` for signed-out users or from `GET sync` for signed-in users.

### Saved data

What must not change:

- **Config keys and value formats.** The code uses: `language`, `server`, `theme`, `background`, `hiddenWidgets`, `resin`, `resinEstimateMode`, `resinNotifyMark`, `realmEnergy`, `realmRank`, `realmCurrency`, `resinCalcButtons`. Defaults are the same as today.
- **Fields the code no longer uses are preserved.** `stats` and `statRetention` are removed from the `Config` type and defaults, but:
  - synced data is merged as `{ ...defaults, ...serverData }`, so unknown fields are kept and never removed by a patch;
  - the `localStorage` code only reads and writes keys the code knows about, so other entries are left alone.
- **`localStorage` format for signed-out users.** One entry per config key, holding the value as JSON. An entry is removed when the value is the default (same reference check as today). Changes made in other tabs are picked up through the `storage` event.
- **`token` cookie.** Value `"null"` for users who continued without signing in. `Path=/`, `Max-Age` 400 days, `SameSite=Lax`, `Secure` on HTTPS.
- **Language values.** Existing values `en-US`, `zh-Hans`, `id` and `ru` keep working. New values are added for the other languages (see [Translations](#translations)). Any value not in the list, such as `nb-NO`, is treated as `default`.
- **Theme** is also written to `localStorage["color-mode"]` whenever it changes, for the startup script.

### API calls

| Call | Used by |
|---|---|
| `POST auth` | Sign in / sign up |
| `GET auth` | Current user (manage account, Discord ID) |
| `PUT auth` | Change username / password |
| `GET sync`, `PATCH sync` (`application/json-patch+json`) | Load and sync config |
| `PUT notifications/{key}`, `DELETE notifications/{key}` | Discord notifications |

Requests send the token as `Authorization: Bearer <token>` from the browser, as today. The API already accepts any origin.

### Discord notifications

Same behavior as `utils/notifications.ts` and `ResinNotification` today:

- Only for signed-in users.
- The desired notification is: key `resin`, time when resin reaches `resinNotifyMark`, title "Resin recharged", description "Your resins have fully recharged!" when the threshold is the cap, otherwise "You have {value} resins right now!", URL `/home`, color `#63b3ed`. Text is in the user's current language, and the URL is made absolute.
- When resin is already at or above the threshold, the desired notification is "none".
- The server is updated 1 second after the desired notification **changes**: `PUT` for a notification, `DELETE` for none. Opening a page never sends anything by itself. The pending update survives page navigation.
- **Changed:** the icon uses a fixed URL, `/resin.png` (in `static/`), instead of a hashed build file. Today, notifications queued before a deploy point to an icon that no longer exists.

### Time

One shared clock (`$state`, updated every second) feeds every time-based display and calculation. Components that today update once a minute derive from the same clock. Server time is computed from it with the existing time-zone code.

## UI layer

### Matching the look

The Tailwind theme (`@theme` in the main CSS file) is set to Chakra's values, copied from `@chakra-ui/react`'s theme files before the dependency is removed:

- **Colors:** Chakra's gray, blue, red, pink and yellow scales (the only ones the kept features use) replace Tailwind's scales of the same name. This includes the shades Chakra's button and form recipes use for the `blue` and `red` color palettes, not just the shades referenced directly in components.
- **Text sizes:** the site's overrides `xs` 10px, `sm` 12px, `md` 14px, `lg` 16px, `xl` 18px, plus Chakra's larger sizes used by headings.
- **Breakpoints:** `sm` 480px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px. `sm` differs from Tailwind's default (640px), and the resin row's phone layout depends on it.
- **Spacing, radii, shadows** as Chakra defines them.
- **Semantic colors** from `utils/theme.ts` (`bg`, `bg.panel`, `bg.subtle`, `bg.muted`, `bg.emphasized`, `gray.subtle`, `gray.muted`, `gray.emphasized`, `fg`, `border`) become CSS variables with `.dark` overrides, keeping today's exact values.
- **Dark mode:** Tailwind's `dark:` variant targets the `dark` class on `<html>`.
- **Fonts:** Inter from `@fontsource-variable/inter` (self-hosted). The Genshin heading font comes from `assets/fonts/Genshin.woff2`.
- **Icons:** `@lucide/svelte`, the same icons as today.

### Components

Hand-written, in `src/lib/components/ui/`, with no UI component library:

| Component | Built on |
|---|---|
| Button (solid, subtle, ghost; sizes; attached group) | `<button>` |
| Dialog | `<dialog>`, which provides Esc-to-close, focus handling and the backdrop |
| Tooltip | Small popup shown on hover and keyboard focus |
| Toast | Error notices, e.g. sync failure, sign-in errors |
| Switch | Styled `<input type="checkbox" role="switch">` |
| Slider | Styled `<input type="range">` |
| Select | Styled native `<select>` |
| Text input, auto-sizing number input | `<input>` |
| Collapsible section | Svelte `slide` transition |
| Loading bar | Shown during startup data load and page navigation |

Feature components live in `src/lib/components/` (header, footer, clock, resin, realm currency, background, shortcut help, notification setup, settings, welcome, sign-in). The existing `aria-label`s and `title`s carry over.

### Static files

`static/` holds the favicons, `site.webmanifest`, `browserconfig.xml`, `robots.txt`, `sw.js` and `resin.png`. Images used by components (game icons, backgrounds, setup screenshots, welcome screenshot) are imported from `src/lib/assets/` so that they get hashed file names.

## Translations

### Languages

The game's 15 languages. Config values and display names:

| Config value | Language | Wiki key |
|---|---|---|
| `en-US` | English | `en` |
| `zh-Hans` | 简体中文 | `zhs` |
| `zh-Hant` | 繁體中文 | `zht` |
| `ja` | 日本語 | `ja` |
| `ko` | 한국어 | `ko` |
| `es` | Español | `es` |
| `fr` | Français | `fr` |
| `ru` | Русский | `ru` |
| `th` | ไทย | `th` |
| `vi` | Tiếng Việt | `vi` |
| `de` | Deutsch | `de` |
| `id` | Bahasa Indonesia | `id` |
| `pt` | Português | `pt` |
| `tr` | Türkçe | `tr` |
| `it` | Italiano | `it` |

The language picker lists `Default` followed by these 15.

### Library

Paraglide JS (`@inlang/paraglide-js`):

- One file per language, `web/messages/<config value>.json`, with named messages (e.g. `resin_full`) and plural variants where needed (e.g. "1 resin" / "5 resins").
- Messages are compiled into typed functions, so a missing or misspelled message name fails type checking.
- Switching language in settings updates the page immediately without a reload.

### Choosing the language

1. The `language` setting, if it's one of the 15.
2. Otherwise, the first of `navigator.languages` that matches one of the 15, using the same alias rules as today (e.g. `zh-CN` → `zh-Hans`), extended for the new languages (e.g. `zh-TW`, `zh-HK` → `zh-Hant`; `pt-BR`, `pt-PT` → `pt`).
3. Otherwise, English.

`<html lang>` is set to the active language. Dates, times and durations are formatted with Luxon in the active language, as today.

### Game terms glossary

- `web/messages/glossary.json` lists every game term that appears in the UI. For each term it stores the source wiki page and the official name in all 15 languages.
- The data comes from the term's `{{Other Languages}}` template on the Genshin Impact Fandom wiki, read through the MediaWiki API (`https://genshin-impact.fandom.com/api.php?action=parse&page=<page>&prop=wikitext&format=json`). The template's keys map to languages as in the table above.
- Terms: Original Resin, Serenitea Pot, Realm Currency, Adeptal Energy, Trust Rank, Teyvat, and the background characters (Paimon, Klee, Diluc, Tartaglia, Zhongli, Xiao, Hu Tao, Kaedehara Kazuha, Kamisato Ayaka). The pickers keep today's short names (Kazuha, Ayaka) where the game uses short forms.
- Translations use the glossary's wording exactly wherever a term appears. The rest of the UI text is translated by Claude. The existing human-written Simplified Chinese and Indonesian strings are reused where the English text is unchanged.
- A small script (`npm run glossary`) refreshes the glossary from the wiki. It is run by hand, never during the build.

`web/messages/README.md` documents how to add or change messages and how to use the glossary.

## Testing

### Unit tests (Vitest)

- Ported: API client, `ConfigSync`, resin and realm math, server time and reset.
- New:
  - `localStorage` compatibility: reads entries in the exact format today's site writes, and writes them back the same way.
  - Unknown fields (e.g. `stats`) survive loading and a sync round trip.
  - An unknown language value (e.g. `nb-NO`) falls back to `default`. Browser language matching picks the right language.
  - Every language file has every message that the English file has.
  - Manage data rejects invalid pasted data and accepts valid data.

### Look comparison (Playwright, headless)

A script in `web/scripts/` builds and serves the old site (from `master`, in a separate worktree) and the new one, and screenshots each pair with a pixel-diff image.

- Both sites are built against a small local fake API server (a Node script in `web/scripts/`) that returns fixed `GET sync` and `GET auth` responses. The old site fetches on its server, so request interception alone can't cover it.
- Both use the same data (in the fake API for signed-in pages, in `localStorage` for signed-out pages) and the same fixed browser clock (Playwright's `page.clock`).

- Pages: welcome, home (realm expanded and collapsed), notifications, settings, the manage-data, manage-account and shortcut dialogs, and the "resin full" state.
- Light and dark mode, at phone (390px) and desktop (1280px) widths.

Claude reviews every pair and fixes differences. The side-by-side images are then shared with the maintainer for review. This runs locally, not in CI.

### Behavior tests (Playwright)

Run against the built site with the API faked by request interception, so no real accounts are touched:

- Sign in, change resin, and check that a correct `PATCH sync` is sent.
- A conflicting sync response replaces local data with the server's.
- `401` from `GET sync` signs the user out.
- The Discord notification is `PUT` only when it changes, `DELETE`d when resin passes the threshold, and not sent on page load.
- A signed-out user's existing `localStorage` data loads and displays.
- Removed URLs redirect (checked against the nginx container).
- Keyboard shortcuts add and subtract resin.

### Tooling and CI

- ESLint (with `eslint-plugin-svelte`), Prettier (with `prettier-plugin-svelte` and `prettier-plugin-tailwindcss`), `svelte-check`, Vitest, and Playwright for the behavior tests.
- `.github/workflows/ci.yml`: the `web` job runs lint, `svelte-check`, the Prettier check, unit tests, the build and the Playwright behavior tests. The `docker` job is unchanged.

## Rollout

- All work happens on the `sveltekit` branch. `web/` is replaced in place, and git history keeps the Next.js version.
- Docs updated: `web/README.md`, `web/messages/README.md` (replaces `web/langs/README.md`), the root `README.md` (stack description, build variables), `build.sh` (`PUBLIC_API_URL` instead of the two `NEXT_PUBLIC_*` variables), and the Dockerfile. `web/AGENTS.md` and `web/CLAUDE.md` are replaced with notes for the new stack.
- Deploy: merge to `master` and deploy the same CapRover app. Rollback: redeploy the previous commit.
- After deploying, the maintainer checks that:
  - a signed-in account loads its data;
  - a browser that used the site without signing in still has its data;
  - a Discord notification arrives;
  - an old bookmark (e.g. `/home/statistics`) redirects.

## Out of scope

- Changes to the `sync` backend, including removing the endpoints only the dropped features used.
- Offline support beyond today's no-op service worker.
- Bringing back statistics or the other removed features.
