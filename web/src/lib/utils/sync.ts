import { createPatch } from "rfc6902";
import type { ApiClient, WebData } from "./api";
import { type Config, ConfigStore } from "./config";

type SyncClient = Pick<ApiClient, "patchSync">;

/**
 * Keeps a config store synchronized with the server.
 *
 * Changes are debounced and sent as JSON patches computed against the last data the server is known to have.
 * Requests are sent one at a time. If the server rejects a patch because another device changed the data
 * in the meantime, the server's data replaces local changes.
 */
export class ConfigSync {
  private token: string;
  private synced: object;
  private timeout?: ReturnType<typeof setTimeout>;
  private running = false;
  private pending = false;

  constructor(
    private readonly store: ConfigStore,
    initial: WebData,
    private readonly withDefaults: (data: Partial<Config>) => Config,
    private readonly client: () => SyncClient,
    private readonly onError: (error: unknown) => void,
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
  async flush() {
    if (this.running) {
      this.pending = true;
      return;
    }

    this.running = true;

    try {
      do {
        this.pending = false;

        const current = this.store.get();
        const patch = createPatch(this.synced, current);

        if (!patch.length) {
          continue;
        }

        let result;

        try {
          result = await this.client().patchSync({ token: this.token, patch });
        } catch (e) {
          // changes stay unsynchronized and are retried with the next change
          this.onError(e);
          break;
        }

        this.token = result.token;

        if (result.type === "success") {
          this.synced = current;
        } else {
          this.synced = result.data;
          this.store.set(this.withDefaults(result.data));
        }
      } while (this.pending);
    } finally {
      this.running = false;
    }
  }
}
