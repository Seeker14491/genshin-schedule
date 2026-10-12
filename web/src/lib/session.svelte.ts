import { goto, invalidateAll } from "$app/navigation";
import { ApiError, isAuthenticated } from "./utils/api";
import { createApiClient, getAuthToken, setAuthToken } from "./utils/auth";
import {
  type Config,
  ConfigKeys,
  ConfigStore,
  getDefaultConfig,
  readLocalConfig,
  type SetConfig,
  withDefaults,
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

/** The auth token of the current session. It differs from the cookie's after signing in or out in another tab. */
export function getSessionToken() {
  return session?.token;
}

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
      initial = await createApiClient(fetchFn, token).getSync();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        // unless another tab replaced the token in the meantime
        if (getAuthToken() === token) {
          setAuthToken(undefined);
        }

        return start(fetchFn);
      }

      throw e;
    }

    // another tab signed in to another account or signed out while loading: load that instead
    if (getAuthToken() !== token) {
      return start(fetchFn);
    }

    // the server doesn't store defaults until the first change. Keys that aren't part of the config are kept
    const fillDefaults = (data: Partial<Config>) => withDefaults(data, defaults);

    session?.stop();
    store.set(fillDefaults(initial.data));

    const current: Session = { token, stop: () => {} };

    /**
     * When the user signed out or switched accounts in another tab, this tab follows by loading the page again, as it
     * would when navigating. Returns whether that happened.
     */
    const followOtherTab = () => {
      if (getAuthToken() === current.token) {
        return false;
      }

      void invalidateAll();
      return true;
    };

    // requests use the session's token rather than the cookie's, so that they can't change another account's data
    const client = () => createApiClient(undefined, current.token);

    const configSync = new ConfigSync(store, initial, fillDefaults, client, (error, operation) => {
      console.error(error);

      // a rejected token (e.g. after the server's secret changed) signs out, as it does when loading.
      // Refreshing happens in the background and is retried later, so only failing to save is shown
      if (error instanceof ApiError && error.status === 401) {
        if (!followOtherTab()) {
          void goto("/sign-out");
        }
      } else if (operation === "send") {
        toaster.error(m.sync_error_title(), m.sync_error_description());
      }
    });

    const stopSync = configSync.start();
    const stopRefreshing = refreshWhileVisible(() => {
      if (!followOtherTab()) {
        void configSync.refresh();
      }
    });

    current.stop = () => {
      stopSync();
      stopRefreshing();
    };

    session = current;
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

/** How often signed-in users' data is downloaded while the page is visible, in case another device changed it. */
const RefreshInterval = 60 * 1000;

/**
 * Calls `refresh` when the data may have been changed on another device: when the user returns to the page, when the
 * connection comes back, and regularly while the page is visible. Returns a function that stops.
 */
function refreshWhileVisible(refresh: () => void) {
  const refreshIfVisible = () => {
    if (document.visibilityState === "visible") {
      refresh();
    }
  };

  const interval = setInterval(refreshIfVisible, RefreshInterval);

  document.addEventListener("visibilitychange", refreshIfVisible);
  window.addEventListener("focus", refreshIfVisible);
  window.addEventListener("online", refreshIfVisible);

  return () => {
    clearInterval(interval);
    document.removeEventListener("visibilitychange", refreshIfVisible);
    window.removeEventListener("focus", refreshIfVisible);
    window.removeEventListener("online", refreshIfVisible);
  };
}

/** Replaces the auth token of the current session, e.g. after changing the username or password. */
export function replaceAuthToken(token: string) {
  setAuthToken(token);

  if (session) {
    session.token = token;
  }
}
