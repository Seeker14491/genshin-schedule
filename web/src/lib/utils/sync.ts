import { createPatch, Pointer } from "rfc6902";
import type { ApiClient, WebData } from "./api";
import { type Config, ConfigStore } from "./config";

type SyncClient = Pick<ApiClient, "getSync" | "patchSync">;

/**
 * Keeps a config store synchronized with the server.
 *
 * Changes are debounced and sent as JSON patches computed against the last data the server is known to have.
 * Requests are sent one at a time. When another device changed the data in the meantime, which is noticed when the
 * server rejects a patch or when `refresh` downloads newer data, the settings changed on this device since the last
 * sync are reapplied on top of the server's data and sent again.
 */
export class ConfigSync {
  private token: string;
  private synced: Partial<Config>;
  private timeout?: ReturnType<typeof setTimeout>;
  private running = false;
  private pending = false;
  private refreshPending = false;
  private refreshing = false;

  constructor(
    private readonly store: ConfigStore,
    initial: WebData,
    private readonly withDefaults: (data: Partial<Config>) => Config,
    private readonly client: () => SyncClient,
    private readonly onError: (error: unknown, operation: "send" | "refresh") => void,
    private readonly delay = 200,
  ) {
    this.token = initial.token;

    // the server doesn't store defaults, so the first patch will add them
    this.synced = initial.data;
  }

  /** Starts watching the store for changes. Returns a function that stops watching. */
  start() {
    const unsubscribe = this.store.subscribe(() => {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => void this.flush(), this.delay);
    });

    return () => {
      unsubscribe();
      clearTimeout(this.timeout);
    };
  }

  /** Sends any unsynchronized changes immediately. */
  flush() {
    this.pending = true;
    return this.run();
  }

  /** Downloads the server's data, in case another device changed it. Does nothing if a download is already underway. */
  refresh() {
    if (!this.refreshing) {
      this.refreshPending = true;
    }

    return this.run();
  }

  private async run() {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      while (this.refreshPending || this.pending) {
        // downloading first means that changes are sent on top of the latest data
        if (this.refreshPending) {
          this.refreshPending = false;
          this.refreshing = true;

          try {
            await this.pull();
          } finally {
            this.refreshing = false;
          }
        } else {
          this.pending = false;
          await this.push();
        }
      }
    } finally {
      this.running = false;
    }
  }

  private async pull() {
    let remote;

    try {
      remote = await this.client().getSync();
    } catch (e) {
      this.onError(e, "refresh");
      return;
    }

    if (remote.token !== this.token) {
      this.receive(remote);
    }
  }

  private async push() {
    const current = this.store.get();
    const patch = createPatch(this.synced, current);

    if (!patch.length) {
      return;
    }

    const token = this.token;
    let result;

    try {
      result = await this.client().patchSync({ token, patch });
    } catch (e) {
      // changes stay unsynchronized and are retried with the next change
      this.onError(e, "send");
      return;
    }

    if (result.type === "success") {
      this.token = result.token;
      this.synced = current;
    } else if (result.token === token) {
      // the server's data didn't change, but the patch couldn't be applied to it. Sending the same changes again
      // would fail the same way, so the server's data replaces them
      this.token = result.token;
      this.synced = result.data;
      this.store.set(this.withDefaults(result.data));
    } else {
      this.receive(result);
      this.pending = true;
    }
  }

  /** Replaces the local data with newer data from the server, keeping the settings changed since the last sync. */
  private receive(remote: WebData) {
    const changed = reapplyChanges(this.withDefaults(this.synced), this.store.get(), this.withDefaults(remote.data));

    this.token = remote.token;
    this.synced = remote.data;
    this.store.set(changed);
  }
}

/**
 * Returns `remote` with the settings that differ between `base` and `local` taken from `local`.
 * Each setting is taken as a whole, so that e.g. resin's value and time always come from the same device.
 */
function reapplyChanges(base: Config, local: Config, remote: Config): Config {
  const from = local as Record<string, unknown>;
  const result: Record<string, unknown> = { ...remote };

  for (const { path } of createPatch(base, local)) {
    const key = Pointer.fromJSON(path).tokens[1];

    if (key in from) {
      result[key] = from[key];
    } else {
      delete result[key];
    }
  }

  return result as Config;
}
