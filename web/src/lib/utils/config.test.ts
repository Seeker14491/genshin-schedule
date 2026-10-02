import { describe, expect, it } from "vitest";
import { getDefaultConfig, readLocalConfig, validateConfigData, writeLocalConfig } from "./config";

/** Browser storage backed by a map. */
class MemoryStorage implements Storage {
  items = new Map<string, string>();

  get length() {
    return this.items.size;
  }

  clear() {
    this.items.clear();
  }

  getItem(key: string) {
    return this.items.get(key) ?? null;
  }

  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.items.delete(key);
  }

  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
}

const defaults = getDefaultConfig(1000);

describe("local config", () => {
  // data as written by the site before the SvelteKit rewrite: each key as JSON, defaults not stored
  const stored = {
    theme: '"dark"',
    server: '"Europe"',
    resin: '{"value":120,"time":1790861400000}',
    resinCalcButtons: "[-40,-20,20]",
    stats: '[{"id":"2024-01-01","time":0,"resinsSpent":160}]',
    statRetention: "28",
    "color-mode": "dark",
  };

  it("reads the format written by the previous version of the site", () => {
    const storage = new MemoryStorage();
    Object.entries(stored).forEach(([key, value]) => storage.setItem(key, value));

    expect(readLocalConfig(storage, defaults)).toEqual({
      ...defaults,
      theme: "dark",
      server: "Europe",
      resin: { value: 120, time: 1790861400000 },
      resinCalcButtons: [-40, -20, 20],
    });
  });

  it("writes changed keys as JSON, removes default values, and leaves other keys alone", () => {
    const storage = new MemoryStorage();
    Object.entries(stored).forEach(([key, value]) => storage.setItem(key, value));

    const config = readLocalConfig(storage, defaults);
    writeLocalConfig(storage, { ...config, server: defaults.server, realmRank: 5 }, defaults);

    expect(Object.fromEntries(storage.items)).toEqual({
      ...stored,
      server: undefined,
      realmRank: "5",
    });
  });

  it("ignores values that aren't valid JSON", () => {
    const storage = new MemoryStorage();
    storage.setItem("theme", "dark");

    expect(readLocalConfig(storage, defaults).theme).toBe("light");
  });
});

describe("validateConfigData", () => {
  it("accepts exported data, including keys the site doesn't use", () => {
    const data = { ...defaults, stats: [] };

    expect(validateConfigData(JSON.stringify(data))).toEqual({ valid: true, data });
  });

  it("accepts partial data and unknown languages", () => {
    expect(validateConfigData('{"theme":"dark","language":"nb-NO"}')).toMatchObject({ valid: true });
  });

  it("rejects text that isn't a JSON object", () => {
    expect(validateConfigData("{")).toEqual({ valid: false, reason: "json" });
    expect(validateConfigData("[1, 2]")).toEqual({ valid: false, reason: "object" });
    expect(validateConfigData("null")).toEqual({ valid: false, reason: "object" });
  });

  it("rejects values of the wrong type", () => {
    expect(validateConfigData('{"server":"Mars"}')).toEqual({ valid: false, reason: "value", key: "server" });
    expect(validateConfigData('{"resin":{"value":"120","time":0}}')).toEqual({
      valid: false,
      reason: "value",
      key: "resin",
    });
    expect(validateConfigData('{"resinCalcButtons":[10,"x"]}')).toEqual({
      valid: false,
      reason: "value",
      key: "resinCalcButtons",
    });
    expect(validateConfigData('{"hiddenWidgets":{"realm":"yes"}}')).toEqual({
      valid: false,
      reason: "value",
      key: "hiddenWidgets",
    });
  });
});
