import { createContext, Dispatch, SetStateAction, useCallback, useContext, useSyncExternalStore } from "react";
import { ResinCap } from "@/db/resins";
import type { Language } from "@/langs";

export type Config = {
  language: Language | "default";
  server: "America" | "Europe" | "Asia" | "TW, HK, MO";
  theme: "light" | "dark";
  background: Background | "none";
  hiddenWidgets: {
    [key in "resin" | "realm"]?: boolean;
  };
  resin: {
    value: number;
    time: number;
  };
  resinEstimateMode: "time" | "value";
  resinNotifyMark: number;
  realmEnergy: number;
  realmRank: number;
  realmCurrency: {
    value: number;
    time: number;
  };
  resinCalcButtons: number[];
  stats: StatFrame[];
  statRetention: number;
};

export type StatFrame = {
  /** Server day in ISO format, e.g. 2020-12-31. */
  id: string;
  time: number;
  resinsSpent: number;
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
    theme: "light",
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
    resinCalcButtons: [-40, -30, -20, -10, 10],
    stats: [],
    statRetention: 28,
  };
}

export const ConfigKeys = Object.keys(getDefaultConfig(0)) as (keyof Config)[];

/** Holds the config and notifies subscribers when it changes. */
export class ConfigStore {
  private readonly listeners = new Set<() => void>();

  constructor(private value: Config) {}

  get = () => this.value;

  set = (action: SetStateAction<Config>) => {
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

export const ConfigContext = createContext<{
  store: ConfigStore;
  /** Config used for server rendering and hydration. */
  serverConfig: Config;
  /** Whether the config is synchronized to an account (as opposed to stored in the browser). */
  synchronized: boolean;
}>({
  store: new ConfigStore(getDefaultConfig(0)),
  serverConfig: getDefaultConfig(0),
  synchronized: false,
});

/** Returns the entire config. Prefer `useConfig` which only rerenders when a specific key changes. */
export function useConfigs(): [Config, Dispatch<SetStateAction<Config>>] {
  const { store, serverConfig } = useContext(ConfigContext);
  return [useSyncExternalStore(store.subscribe, store.get, () => serverConfig), store.set];
}

/** Returns a config value and a setter, similar to `useState`. */
export function useConfig<TKey extends keyof Config>(
  key: TKey,
): [Config[TKey], Dispatch<SetStateAction<Config[TKey]>>] {
  const { store, serverConfig } = useContext(ConfigContext);

  const value = useSyncExternalStore(
    store.subscribe,
    () => store.get()[key],
    () => serverConfig[key],
  );

  const setValue = useCallback(
    (action: SetStateAction<Config[TKey]>) => {
      store.set((config) => ({
        ...config,
        [key]: typeof action === "function" ? (action as (prev: Config[TKey]) => Config[TKey])(config[key]) : action,
      }));
    },
    [store, key],
  );

  return [value, setValue];
}
