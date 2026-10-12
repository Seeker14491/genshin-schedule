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
  downloads = 0;
  fail = false;

  constructor(data: Partial<Config> = {}) {
    this.data = structuredClone(data);
  }

  async getSync(): Promise<WebData> {
    this.downloads++;

    if (this.fail) {
      throw new Error("network error");
    }

    return { token: this.token, data: structuredClone(this.data) };
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
    store.set((c) => ({ ...c, theme: defaults.theme }));
    await vi.advanceTimersByTimeAsync(200);

    expect(server.requests).toHaveLength(0);
  });

  it("keeps settings changed on this device when another device changed others", async () => {
    const server = new FakeServer(defaults);
    const { store } = setup(server);

    server.changeElsewhere([{ op: "replace", path: "/realmRank", value: 9 }]);
    store.set((c) => ({ ...c, theme: "dark" }));
    await vi.advanceTimersByTimeAsync(200);

    expect(store.get()).toMatchObject({ realmRank: 9, theme: "dark" });
    expect(server.data).toMatchObject({ realmRank: 9, theme: "dark" });
    expect(server.requests.at(-1)!.patch).toEqual([{ op: "replace", path: "/theme", value: "dark" }]);
  });

  it("keeps this device's value when both devices changed the same setting", async () => {
    const server = new FakeServer(defaults);
    const { store } = setup(server);

    server.changeElsewhere([{ op: "replace", path: "/resin", value: { value: 150, time: 2000 } }]);
    store.set((c) => ({ ...c, resin: { value: 50, time: 1000 } }));
    await vi.advanceTimersByTimeAsync(200);

    expect(store.get().resin).toEqual({ value: 50, time: 1000 });
    expect(server.data.resin).toEqual({ value: 50, time: 1000 });
  });

  it("takes each changed setting as a whole instead of merging it with the other device's", async () => {
    const server = new FakeServer({ ...defaults, resinCalcButtons: [-60, -40, -20] });
    const { store } = setup(server);

    server.changeElsewhere([{ op: "replace", path: "/resinCalcButtons", value: [-30, -10] }]);
    store.set((c) => ({ ...c, resinCalcButtons: [-60, -20] }));
    await vi.advanceTimersByTimeAsync(200);

    expect(store.get().resinCalcButtons).toEqual([-60, -20]);
    expect(server.data.resinCalcButtons).toEqual([-60, -20]);
  });

  it("doesn't overwrite another device's changes with defaults the server didn't have yet", async () => {
    const server = new FakeServer();
    const { store } = setup(server);

    // the other device's first change saved its defaults too
    server.changeElsewhere(
      Object.entries({ ...defaults, theme: "dark" }).map(([key, value]) => ({
        op: "add",
        path: `/${key}`,
        value,
      })),
    );
    store.set((c) => ({ ...c, realmRank: 4 }));
    await vi.advanceTimersByTimeAsync(200);

    expect(server.data).toEqual({ ...defaults, theme: "dark", realmRank: 4 });
  });

  it("replaces local changes with the server's data when the server can't apply them", async () => {
    const server = new FakeServer(defaults);
    const patchSync = server.patchSync.bind(server);
    const { store } = setup(server);

    // e.g. a patch the server's JSON Patch implementation rejects
    server.patchSync = async (request) => {
      if (request.patch.some((op) => op.path === "/theme")) {
        server.requests.push(request);
        return { type: "failure", token: server.token, data: structuredClone(server.data) };
      }

      return patchSync(request);
    };

    store.set((c) => ({ ...c, theme: "dark" }));
    await vi.advanceTimersByTimeAsync(1000);

    expect(store.get().theme).toBe(defaults.theme);
    expect(server.requests).toHaveLength(1);
  });

  it("downloads changes made on another device when refreshed", async () => {
    const server = new FakeServer(defaults);
    const { store, sync } = setup(server);

    server.changeElsewhere([{ op: "replace", path: "/realmRank", value: 9 }]);
    await sync.refresh();
    await vi.advanceTimersByTimeAsync(1000);

    expect(store.get().realmRank).toBe(9);
    expect(server.requests).toHaveLength(0);

    // later changes are based on the downloaded data
    store.set((c) => ({ ...c, theme: "dark" }));
    await vi.advanceTimersByTimeAsync(200);

    expect(server.requests.at(-1)).toEqual({
      token: "elsewhere",
      patch: [{ op: "replace", path: "/theme", value: "dark" }],
    });
  });

  it("keeps changes that weren't sent yet when refreshed", async () => {
    const server = new FakeServer(defaults);
    const { store, sync } = setup(server);

    server.changeElsewhere([{ op: "replace", path: "/realmRank", value: 9 }]);
    store.set((c) => ({ ...c, theme: "dark" }));
    await sync.refresh();

    expect(store.get()).toMatchObject({ realmRank: 9, theme: "dark" });

    await vi.advanceTimersByTimeAsync(200);

    expect(server.requests).toHaveLength(1);
    expect(server.data).toMatchObject({ realmRank: 9, theme: "dark" });
  });

  it("doesn't send downloaded data back, even when the server doesn't have the defaults", async () => {
    const server = new FakeServer({ theme: "light" });
    const { store, sync } = setup(server);

    server.changeElsewhere([{ op: "add", path: "/realmRank", value: 9 }]);
    await sync.refresh();
    await vi.advanceTimersByTimeAsync(1000);

    expect(store.get()).toMatchObject({ theme: "light", realmRank: 9 });
    expect(server.requests).toHaveLength(0);
  });

  it("sends changes that failed to send once refreshing succeeds", async () => {
    const server = new FakeServer(defaults);
    const { store, sync } = setup(server);

    server.fail = true;
    store.set((c) => ({ ...c, theme: "dark" }));
    await vi.advanceTimersByTimeAsync(200);

    server.fail = false;
    server.changeElsewhere([{ op: "replace", path: "/realmRank", value: 9 }]);
    await sync.refresh();

    expect(server.data).toMatchObject({ theme: "dark", realmRank: 9 });
  });

  it("leaves the data alone when refreshing finds nothing new", async () => {
    const server = new FakeServer(defaults);
    const { store, sync } = setup(server);
    const before = store.get();

    await sync.refresh();

    expect(server.downloads).toBe(1);
    expect(store.get()).toBe(before);
  });

  it("reports errors while refreshing separately, without changing the data", async () => {
    const server = new FakeServer(defaults);
    const { store, sync, onError } = setup(server);
    const before = store.get();

    server.fail = true;
    await sync.refresh();

    expect(onError).toHaveBeenCalledExactlyOnceWith(expect.any(Error), "refresh");
    expect(store.get()).toBe(before);
  });

  it("downloads once when refreshed again during a download", async () => {
    const server = new FakeServer(defaults);
    const getSync = server.getSync.bind(server);
    const { sync } = setup(server);

    server.getSync = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return getSync();
    };

    void sync.refresh();
    void sync.refresh();
    await vi.advanceTimersByTimeAsync(1000);

    expect(server.downloads).toBe(1);
  });

  it("waits for changes being sent before refreshing", async () => {
    const server = new FakeServer(defaults);
    const patchSync = server.patchSync.bind(server);
    const order: string[] = [];

    server.patchSync = async (request) => {
      order.push("patch start");
      await new Promise((resolve) => setTimeout(resolve, 500));
      order.push("patch end");
      return patchSync(request);
    };

    const getSync = server.getSync.bind(server);
    server.getSync = async () => {
      order.push("download");
      return getSync();
    };

    const { store, sync } = setup(server);

    store.set((c) => ({ ...c, theme: "dark" }));
    await vi.advanceTimersByTimeAsync(300);
    void sync.refresh();
    await vi.advanceTimersByTimeAsync(1000);

    expect(order).toEqual(["patch start", "patch end", "download"]);
    expect(store.get().theme).toBe("dark");
  });

  it("retries unsent changes with the next change after an error", async () => {
    const server = new FakeServer(defaults);
    const { store, onError } = setup(server);

    server.fail = true;
    store.set((c) => ({ ...c, theme: "dark" }));
    await vi.advanceTimersByTimeAsync(200);

    expect(onError).toHaveBeenCalledExactlyOnceWith(expect.any(Error), "send");
    expect(server.data.theme).toBe(defaults.theme);

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

  it("keeps data the site no longer uses, such as statistics", async () => {
    const stats = [{ id: "2024-01-01", time: 0, resinsSpent: 160 }];
    const server = new FakeServer({ ...defaults, stats, statRetention: 28 } as Partial<Config>);
    const { store } = setup(server);

    store.set((c) => ({ ...c, theme: "dark" }));
    await vi.advanceTimersByTimeAsync(200);

    expect(server.requests[0].patch).toEqual([{ op: "replace", path: "/theme", value: "dark" }]);
    expect(server.data).toMatchObject({ stats, statRetention: 28, theme: "dark" });
  });

  it("ignores downloads that finish after stopping", async () => {
    const server = new FakeServer(defaults);
    const getSync = server.getSync.bind(server);
    const { store, sync, onError, stop } = setup(server);
    const before = store.get();

    server.getSync = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return getSync();
    };

    server.changeElsewhere([{ op: "replace", path: "/realmRank", value: 9 }]);
    void sync.refresh();
    stop();
    await vi.advanceTimersByTimeAsync(1000);

    expect(server.downloads).toBe(1);
    expect(store.get()).toBe(before);

    // nor are errors reported
    server.fail = true;
    void sync.refresh();
    await vi.advanceTimersByTimeAsync(1000);

    expect(onError).not.toHaveBeenCalled();
  });

  it("ignores conflicts that are noticed after stopping, and doesn't start queued requests", async () => {
    const server = new FakeServer(defaults);
    const patchSync = server.patchSync.bind(server);
    const { store, sync, stop } = setup(server);

    server.patchSync = async (request) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return patchSync(request);
    };

    server.changeElsewhere([{ op: "replace", path: "/realmRank", value: 9 }]);
    store.set((c) => ({ ...c, theme: "dark" }));
    await vi.advanceTimersByTimeAsync(300);
    void sync.refresh();
    stop();
    await vi.advanceTimersByTimeAsync(2000);

    // the next session sets the store, e.g. to the browser's data after signing out
    expect(store.get()).toMatchObject({ realmRank: defaults.realmRank, theme: "dark" });
    expect(server.requests).toHaveLength(1);
    expect(server.downloads).toBe(0);
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
