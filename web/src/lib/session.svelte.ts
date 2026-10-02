import { ApiError, isAuthenticated } from "./utils/api";
import { createApiClient, getAuthToken, setAuthToken } from "./utils/auth";
import {
  type Config,
  ConfigKeys,
  ConfigStore,
  getDefaultConfig,
  readLocalConfig,
  type SetConfig,
  writeLocalConfig,
} from "./utils/config";
import { ConfigSync } from "./utils/sync";
import { toaster } from "./components/ui/toaster.svelte";
import { m } from "./paraglide/messages.js";

/** The user's config, shared by the whole app. */
export const store = new ConfigStore(getDefaultConfig(Date.now()));

let current = $state.raw(store.get());
store.subscribe(() => (current = store.get()));

/**
 * The user's config as a reactive object: reading a key (e.g. `config.resin`) updates the page when it changes,
 * and assigning a key saves it.
 */
export const config = {} as Config;

for (const key of ConfigKeys) {
  // each key only notifies readers when its own value changes
  const value = $derived(current[key]);

  Object.defineProperty(config, key, {
    enumerable: true,
    get: () => value,
    set: (value) => store.set((config) => ({ ...config, [key]: value })),
  });
}

/** Updates a config value based on its previous value, e.g. `updateConfig("resin", (resin) => ...)`. */
export function updateConfig<K extends keyof Config>(key: K, action: SetConfig<Config[K]>) {
  store.set((config) => ({
    ...config,
    [key]: typeof action === "function" ? (action as (previous: Config[K]) => Config[K])(config[key]) : action,
  }));
}

type Session = {
  /** The auth token the session was started with. */
  token: string | undefined;
  stop: () => void;
};

let session: Session | undefined;
let starting: Promise<void> | undefined;

/** Whether the config is synchronized to an account, as opposed to stored in the browser. */
export const sessionState = $state({ synchronized: false });

/**
 * Loads the config for the user in the auth cookie, unless it's already loaded.
 * Signed-in users' config is downloaded and kept synchronized, and everyone else's is stored in the browser.
 * If the server rejects the token, e.g. because the account was deleted, the user is signed out.
 * `fetchFn` is the `fetch` passed to the calling load function.
 */
export async function startSession(fetchFn: typeof fetch) {
  while (starting) {
    await starting;
  }

  if (session && session.token === getAuthToken()) {
    return;
  }

  starting = start(fetchFn).finally(() => (starting = undefined));
  await starting;
}

async function start(fetchFn: typeof fetch): Promise<void> {
  const token = getAuthToken();
  const defaults = getDefaultConfig(Date.now());

  if (isAuthenticated(token)) {
    let initial;

    try {
      initial = await createApiClient(fetchFn).getSync();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setAuthToken(undefined);
        return start(fetchFn);
      }

      throw e;
    }

    // the server doesn't store defaults. Keys that aren't part of the config are kept
    const withDefaults = (data: Partial<Config>) => ({ ...defaults, ...data });

    session?.stop();
    store.set(withDefaults(initial.data));

    const configSync = new ConfigSync(store, initial, withDefaults, createApiClient, (error) => {
      console.error(error);

      toaster.error(m.sync_error_title(), m.sync_error_description());
    });

    session = { token, stop: configSync.start() };
    sessionState.synchronized = true;
  } else {
    session?.stop();
    store.set(readLocalConfig(localStorage, defaults));

    // persist local changes, and pick up changes made in other tabs
    const unsubscribe = store.subscribe(() => writeLocalConfig(localStorage, store.get(), defaults));
    const handleStorage = () => store.set(readLocalConfig(localStorage, defaults));

    window.addEventListener("storage", handleStorage);

    session = {
      token,
      stop: () => {
        unsubscribe();
        window.removeEventListener("storage", handleStorage);
      },
    };

    sessionState.synchronized = false;
  }
}

/** Replaces the auth token of the current session, e.g. after changing the username or password. */
export function replaceAuthToken(token: string) {
  setAuthToken(token);

  if (session) {
    session.token = token;
  }
}
