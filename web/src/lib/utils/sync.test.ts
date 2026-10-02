import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyPatch, type Patch } from "rfc6902";
import type { SyncRequest, SyncResult, WebData } from "./api";
import { type Config, ConfigStore, getDefaultConfig } from "./config";
import { ConfigSync } from "./sync";

const defaults = getDefaultConfig(0);
const withDefaults = (data: Partial<Config>) => ({ ...defaults, ...data });

/** In-memory imitation of the sync server, which applies patches if the token matches. */
class FakeServer {
  data: Partial<Config>;
  token = "t0";
  requests: SyncRequest[] = [];
  fail = false;

  constructor(data: Partial<Config> = {}) {
    this.data = structuredClone(data);
  }

  async patchSync(request: SyncRequest): Promise<SyncResult> {
    this.requests.push(request);

    if (this.fail) {
      throw new Error("network error");
    }

    if (request.token !== this.token) {
      return { type: "failure", token: this.token, data: structuredClone(this.data) };
    }

    const errors = applyPatch(this.data, structuredClone(request.patch)).filter(Boolean);

    if (errors.length) {
      return { type: "failure", token: this.token, data: structuredClone(this.data) };
    }

    this.token = `t${this.requests.length}`;
    return { type: "success", token: this.token };
  }

  /** Simulates another device changing the data. */
  changeElsewhere(patch: Patch) {
    applyPatch(this.data, patch);
    this.token = "elsewhere";
  }
}

function setup(server: FakeServer) {
  const initial: WebData = { token: server.token, data: structuredClone(server.data) };
  const store = new ConfigStore(withDefaults(initial.data));
  const onError = vi.fn();
  const sync = new ConfigSync(store, initial, withDefaults, () => server, onError);
  const stop = sync.start();

  return { store, sync, onError, stop };
}

describe("ConfigSync", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("sends debounced changes, including defaults the server doesn't have yet", async () => {
    const server = new FakeServer();
    const { store } = setup(server);

    store.set((c) => ({ ...c, theme: "dark" }));
    store.set((c) => ({ ...c, resin: { value: 120, time: 1000 } }));

    await vi.advanceTimersByTimeAsync(199);
    expect(server.requests).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(1);
    expect(server.requests).toHaveLength(1);
    expect(server.data).toEqual({ ...defaults, theme: "dark", resin: { value: 120, time: 1000 } });
  });

  it("only sends what changed since the last successful sync", async () => {
    const server = new FakeServer(defaults);
    const { store } = setup(server);

    store.set((c) => ({ ...c, realmRank: 5 }));
    await vi.advanceTimersByTimeAsync(200);

    store.set((c) => ({ ...c, realmRank: 6 }));
    await vi.advanceTimersByTimeAsync(200);

    expect(server.requests.map((r) => r.patch)).toEqual([
      [{ op: "replace", path: "/realmRank", value: 5 }],
      [{ op: "replace", path: "/realmRank", value: 6 }],
    ]);
    expect(server.data.realmRank).toBe(6);
  });

  it("doesn't send a request when nothing changed", async () => {
    const server = new FakeServer(defaults);
    const { store } = setup(server);

    store.set((c) => ({ ...c, theme: "dark" }));
    store.set((c) => ({ ...c, theme: "light" }));
    await vi.advanceTimersByTimeAsync(200);

    expect(server.requests).toHaveLength(0);
  });

  it("replaces local data with the server's when another device changed it", async () => {
    const server = new FakeServer(defaults);
    const { store } = setup(server);

    server.changeElsewhere([{ op: "replace", path: "/realmRank", value: 9 }]);
    store.set((c) => ({ ...c, theme: "dark" }));
    await vi.advanceTimersByTimeAsync(200);

    expect(store.get().realmRank).toBe(9);
    expect(store.get().theme).toBe("light");

    // later changes are based on the server's data
    store.set((c) => ({ ...c, theme: "dark" }));
    await vi.advanceTimersByTimeAsync(400);

    expect(server.data).toMatchObject({ realmRank: 9, theme: "dark" });
  });

  it("retries unsent changes with the next change after an error", async () => {
    const server = new FakeServer(defaults);
    const { store, onError } = setup(server);

    server.fail = true;
    store.set((c) => ({ ...c, theme: "dark" }));
    await vi.advanceTimersByTimeAsync(200);

    expect(onError).toHaveBeenCalledOnce();
    expect(server.data.theme).toBe("light");

    server.fail = false;
    store.set((c) => ({ ...c, realmRank: 3 }));
    await vi.advanceTimersByTimeAsync(200);

    expect(server.data).toMatchObject({ theme: "dark", realmRank: 3 });
  });

  it("sends one request at a time", async () => {
    const server = new FakeServer(defaults);
    const patchSync = server.patchSync.bind(server);
    let inFlight = 0;
    let maxInFlight = 0;

    server.patchSync = async (request) => {
      maxInFlight = Math.max(maxInFlight, ++inFlight);
      await new Promise((resolve) => setTimeout(resolve, 500));
      inFlight--;
      return patchSync(request);
    };

    const { store } = setup(server);

    store.set((c) => ({ ...c, realmRank: 2 }));
    await vi.advanceTimersByTimeAsync(300);
    store.set((c) => ({ ...c, realmRank: 3 }));
    await vi.advanceTimersByTimeAsync(2000);

    expect(maxInFlight).toBe(1);
    expect(server.data.realmRank).toBe(3);
  });

  it("stops watching the store when stopped", async () => {
    const server = new FakeServer(defaults);
    const { store, stop } = setup(server);

    store.set((c) => ({ ...c, theme: "dark" }));
    stop();
    await vi.advanceTimersByTimeAsync(1000);

    expect(server.requests).toHaveLength(0);
  });
});
