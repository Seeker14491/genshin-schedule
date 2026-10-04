import { ResinCap } from "#lib/db/resin.ts";
import type { Language } from "#lib/languages.ts";

export type Config = {
  /** A language code, or "default" to use the browser's language. Unknown codes are treated as "default". */
  language: Language | "default";
  server: "America" | "Europe" | "Asia" | "TW, HK, MO";
  theme: "system" | "light" | "dark";
  background: Background | "none";
  hiddenWidgets: {
    [key in "resin" | "realm"]?: boolean;
  };
  resin: {
    value: number;
    time: number;
  };
  resinEstimateMode: "time" | "value";
  /** Resin at which a notification is sent, a whole number from 1 to the cap. */
  resinNotifyMark: number;
  realmEnergy: number;
  realmRank: number;
  realmCurrency: {
    value: number;
    time: number;
  };
  resinCalcButtons: number[];
};

export const Backgrounds = [
  "paimon",
  "klee",
  "diluc",
  "tartaglia",
  "zhongli",
  "xiao",
  "hutao",
  "kazuha",
  "ayaka",
] as const;

export type Background = (typeof Backgrounds)[number];

export const ServerList: Config["server"][] = ["America", "Europe", "Asia", "TW, HK, MO"];

/** Creates the default config. `now` is the time new resin and realm currency counters start from. */
export function getDefaultConfig(now: number): Config {
  return {
    language: "default",
    server: "America",
    theme: "system",
    background: "paimon",
    hiddenWidgets: { realm: true },
    resin: {
      value: 0,
      time: now,
    },
    resinEstimateMode: "time",
    resinNotifyMark: ResinCap,
    realmEnergy: 0,
    realmRank: 1,
    realmCurrency: {
      value: 0,
      time: now,
    },
    resinCalcButtons: [-60, -40, -30, -20, -10, 60],
  };
}

export const ConfigKeys = Object.keys(getDefaultConfig(0)) as (keyof Config)[];

// the default resin buttons before -60 and +60 replaced +10
const OldDefaultResinButtons = [-40, -30, -20, -10, 10];

/**
 * Fills in defaults for keys missing from saved data.
 *
 * Signed-in users' data also has the defaults of when they first changed something, since the first sync saves them.
 * Resin buttons saved as the old default set are replaced with the current one, as they were most likely never changed.
 */
export function withDefaults(data: Partial<Config>, defaults: Config): Config {
  const config = { ...defaults, ...data };
  const buttons = config.resinCalcButtons;

  if (
    Array.isArray(buttons) &&
    buttons.length === OldDefaultResinButtons.length &&
    buttons.every((value, i) => value === OldDefaultResinButtons[i])
  ) {
    config.resinCalcButtons = defaults.resinCalcButtons;
  }

  return config;
}

export type SetConfig<T> = T | ((previous: T) => T);

/**
 * Holds the config and notifies subscribers when it changes.
 *
 * The config may contain keys that aren't part of `Config`, e.g. data of features that were removed.
 * They are kept as is, so that they are never deleted from the user's data.
 */
export class ConfigStore {
  private readonly listeners = new Set<() => void>();

  constructor(private value: Config) {}

  get = () => this.value;

  set = (action: SetConfig<Config>) => {
    const value = typeof action === "function" ? action(this.value) : action;

    if (value !== this.value) {
      this.value = value;
      this.listeners.forEach((listener) => listener());
    }
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  };
}

/**
 * Reads the config of users who aren't signed in from browser storage.
 * Each key is stored separately as JSON, and keys with default values are not stored.
 */
export function readLocalConfig(storage: Storage, defaults: Config): Config {
  const data: Record<string, unknown> = {};

  for (const key of ConfigKeys) {
    try {
      const value = storage.getItem(key);

      if (value !== null) {
        data[key] = JSON.parse(value);
      }
    } catch {
      // ignored
    }
  }

  return withDefaults(data, defaults);
}

/** Writes the config to browser storage in the format `readLocalConfig` reads. Other keys in storage are left alone. */
export function writeLocalConfig(storage: Storage, config: Config, defaults: Config) {
  for (const key of ConfigKeys) {
    if (config[key] === defaults[key]) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, JSON.stringify(config[key]));
    }
  }
}

const isNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value);
const isTimedValue = (value: unknown) =>
  !!value &&
  typeof value === "object" &&
  isNumber((value as Config["resin"]).value) &&
  isNumber((value as Config["resin"]).time);
const isOneOf = (values: readonly unknown[]) => (value: unknown) => values.includes(value);
const isIntegerIn = (min: number, max: number) => (value: unknown) =>
  Number.isInteger(value) && (value as number) >= min && (value as number) <= max;

const validators: Record<keyof Config, (value: unknown) => boolean> = {
  // unknown languages are allowed, since they're treated as "default"
  language: (value) => typeof value === "string",
  server: isOneOf(ServerList),
  theme: isOneOf(["system", "light", "dark"]),
  background: isOneOf([...Backgrounds, "none"]),
  hiddenWidgets: (value) =>
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.values(value).every((hidden) => typeof hidden === "boolean"),
  resin: isTimedValue,
  resinEstimateMode: isOneOf(["time", "value"]),
  resinNotifyMark: isIntegerIn(1, ResinCap),
  realmEnergy: isNumber,
  realmRank: isNumber,
  realmCurrency: isTimedValue,
  resinCalcButtons: (value) => Array.isArray(value) && value.every(isNumber),
};

export type ConfigValidation =
  | { valid: true; data: Partial<Config> & Record<string, unknown> }
  | { valid: false; reason: "json" }
  | { valid: false; reason: "object" }
  | { valid: false; reason: "value"; key: keyof Config };

/**
 * Checks config data pasted by the user, e.g. to restore a backup. It must be a JSON object, and every config key it
 * contains must have a value of the right type. Keys that aren't part of `Config` are allowed and kept.
 */
export function validateConfigData(json: string): ConfigValidation {
  let data: unknown;

  try {
    data = JSON.parse(json);
  } catch {
    return { valid: false, reason: "json" };
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, reason: "object" };
  }

  for (const key of ConfigKeys) {
    if (key in data && !validators[key]((data as Record<string, unknown>)[key])) {
      return { valid: false, reason: "value", key };
    }
  }

  return { valid: true, data: data as Partial<Config> };
}
