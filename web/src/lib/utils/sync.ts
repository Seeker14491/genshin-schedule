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
  private updating = false;
  private stopped = false;

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

  /**
   * Starts watching the store for changes. Returns a function that stops synchronizing, after which requests that are
   * still underway are ignored, so that they can't change the store of the next session.
   */
  start() {
    const unsubscribe = this.store.subscribe(() => {
      // data from the server doesn't need to be sent back
      if (this.updating) {
        return;
      }

      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => void this.flush(), this.delay);
    });

    return () => {
      this.stopped = true;
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
      while (!this.stopped && (this.refreshPending || this.pending)) {
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
    const remote = await this.request("refresh", (client) => client.getSync());

    if (remote && remote.token !== this.token && this.receive(remote)) {
      this.pending = true;
    }
  }

  private async push() {
    const current = this.store.get();
    const patch = createPatch(this.synced, current);

    if (!patch.length) {
      return;
    }

    const token = this.token;
    const result = await this.request("send", (client) => client.patchSync({ token, patch }));

    if (!result) {
      // changes stay unsynchronized and are retried with the next change
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
      this.update(this.withDefaults(result.data));
    } else if (this.receive(result)) {
      this.pending = true;
    }
  }

  /** Sends a request. Resolves to undefined if it fails, or if synchronization was stopped in the meantime. */
  private async request<T>(operation: "send" | "refresh", send: (client: SyncClient) => Promise<T>) {
    try {
      const result = await send(this.client());
      return this.stopped ? undefined : result;
    } catch (e) {
      if (!this.stopped) {
        this.onError(e, operation);
      }
    }
  }

  /**
   * Replaces the local data with newer data from the server, keeping the settings changed since the last sync.
   * Returns whether there were such changes, which still need to be sent.
   */
  private receive(remote: WebData) {
    const local = this.store.get() as Record<string, unknown>;
    const changed = changedSettings(this.withDefaults(this.synced), local);
    const config: Record<string, unknown> = { ...this.withDefaults(remote.data) };

    // each setting is taken as a whole, so that e.g. resin's value and time always come from the same device
    for (const key of changed) {
      if (key in local) {
        config[key] = local[key];
      } else {
        delete config[key];
      }
    }

    this.token = remote.token;
    this.synced = remote.data;
    this.update(config as Config);

    return changed.size > 0;
  }

  /** Sets the store to data that came from the server. */
  private update(config: Config) {
    this.updating = true;

    try {
      this.store.set(config);
    } finally {
      this.updating = false;
    }
  }
}

/** Returns the top-level keys whose values differ between two configs. */
function changedSettings(a: object, b: object) {
  return new Set(createPatch(a, b).map(({ path }) => Pointer.fromJSON(path).tokens[1]));
}
