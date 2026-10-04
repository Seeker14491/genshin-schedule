import { describe, expect, it } from "vitest";
import { getDefaultConfig, readLocalConfig, validateConfigData, withDefaults, writeLocalConfig } from "./config";

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

    expect(readLocalConfig(storage, defaults).theme).toBe(defaults.theme);
  });

  it("stops storing resin buttons saved as the old default", () => {
    const storage = new MemoryStorage();
    storage.setItem("resinCalcButtons", "[-40,-30,-20,-10,10]");

    const config = readLocalConfig(storage, defaults);
    expect(config.resinCalcButtons).toBe(defaults.resinCalcButtons);

    writeLocalConfig(storage, config, defaults);
    expect(storage.getItem("resinCalcButtons")).toBeNull();
  });
});

describe("withDefaults", () => {
  it("fills in missing keys and keeps keys the site doesn't use", () => {
    expect(withDefaults({ server: "Asia", stats: [] } as object, defaults)).toEqual({
      ...defaults,
      server: "Asia",
      stats: [],
    });
  });

  it("follows the system theme and has -60 and +60 resin buttons by default", () => {
    expect(defaults.theme).toBe("system");
    expect(defaults.resinCalcButtons).toEqual([-60, -40, -30, -20, -10, 60]);
  });

  it("replaces resin buttons saved as the old default, and keeps any others", () => {
    expect(withDefaults({ resinCalcButtons: [-40, -30, -20, -10, 10] }, defaults).resinCalcButtons).toEqual(
      defaults.resinCalcButtons,
    );
    expect(withDefaults({ resinCalcButtons: [-40, -30, -20, 10] }, defaults).resinCalcButtons).toEqual([
      -40, -30, -20, 10,
    ]);
    expect(withDefaults({ resinCalcButtons: [] }, defaults).resinCalcButtons).toEqual([]);
  });
});

describe("validateConfigData", () => {
  it("accepts exported data, including keys the site doesn't use", () => {
    const data = { ...defaults, stats: [] };

    expect(validateConfigData(JSON.stringify(data))).toEqual({ valid: true, data });
  });

  it("accepts partial data and unknown languages", () => {
    expect(validateConfigData('{"theme":"dark","language":"nb-NO"}')).toMatchObject({ valid: true });
    expect(validateConfigData('{"theme":"system"}')).toMatchObject({ valid: true });
  });

  it("accepts notification thresholds that are whole numbers from 1 to the cap", () => {
    for (const value of [1, 155, 200]) {
      expect(validateConfigData(`{"resinNotifyMark":${value}}`)).toMatchObject({ valid: true });
    }

    for (const value of [0, 201, 1.5, '"100"']) {
      expect(validateConfigData(`{"resinNotifyMark":${value}}`)).toEqual({
        valid: false,
        reason: "value",
        key: "resinNotifyMark",
      });
    }
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
