"use client";

import { ReactNode, useContext, useEffect, useState } from "react";
import { IntlProvider } from "react-intl";
import { useTheme } from "next-themes";
import type { WebData } from "@/utils/api";
import { createApiClient } from "@/utils/auth";
import { Config, ConfigContext, ConfigKeys, ConfigStore, getDefaultConfig, useConfig } from "@/utils/config";
import { ConfigSync } from "@/utils/sync";
import { RenderTimeContext } from "@/utils/time";
import { Language, Localizations } from "@/langs";
import { toaster } from "./ui/toaster";

/**
 * Provides the user's config, localization and the current time to all components.
 * The config is synchronized to the server if `initial` is given, otherwise it is stored in the browser.
 */
const ConfigProvider = ({
  initial,
  language,
  renderTime,
  children,
}: {
  initial?: WebData | null;
  language?: Language | null;
  /** Time at which the page was rendered on the server. */
  renderTime: number;
  children?: ReactNode;
}) => {
  const [{ context, defaults }] = useState(() => {
    const defaults = getDefaultConfig(renderTime);

    if (initial) {
      const config = { ...defaults, ...initial.data };
      return { defaults, context: { store: new ConfigStore(config), serverConfig: config, synchronized: true } };
    } else {
      // local config is stored in the browser, so the server renders defaults
      const config = typeof window === "undefined" ? defaults : readLocalConfig(defaults);
      return { defaults, context: { store: new ConfigStore(config), serverConfig: defaults, synchronized: false } };
    }
  });

  useEffect(() => {
    const { store } = context;

    if (initial) {
      const sync = new ConfigSync(
        store,
        initial,
        (data) => ({ ...defaults, ...data }),
        createApiClient,
        (error) => {
          console.error(error);

          toaster.create({
            type: "error",
            title: "Synchronization error",
            description: "Could not synchronize changes at the moment. Please try again later.",
            closable: true,
          });
        },
      );

      return sync.start();
    } else {
      // persist local changes, and pick up changes made in other tabs
      const unsubscribe = store.subscribe(() => writeLocalConfig(store.get(), defaults));
      const handleStorage = () => store.set(readLocalConfig(defaults));

      window.addEventListener("storage", handleStorage);

      return () => {
        unsubscribe();
        window.removeEventListener("storage", handleStorage);
      };
    }
    // initial data is only read once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, defaults]);

  return (
    <ConfigContext.Provider value={context}>
      <RenderTimeContext.Provider value={renderTime}>
        <LocalizationProvider language={language || "en-US"}>
          <ThemeSync />
          {children}
        </LocalizationProvider>
      </RenderTimeContext.Provider>
    </ConfigContext.Provider>
  );
};

const LocalizationProvider = ({ language, children }: { language: Language; children?: ReactNode }) => {
  const [configLanguage] = useConfig("language");
  const locale = configLanguage === "default" ? language : configLanguage;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <IntlProvider locale={locale} messages={Localizations[locale]}>
      {children}
    </IntlProvider>
  );
};

// applies the theme from the config to the page
const ThemeSync = () => {
  const { store } = useContext(ConfigContext);
  const { setTheme } = useTheme();

  // read the store directly rather than `useConfig`, which returns the server value while hydrating
  useEffect(() => {
    const update = () => setTheme(store.get().theme);

    update();
    return store.subscribe(update);
  }, [store, setTheme]);

  return null;
};

// each key is stored separately as JSON; keys with default values are not stored
function readLocalConfig(defaults: Config): Config {
  const config = { ...defaults };

  for (const key of ConfigKeys) {
    try {
      const value = localStorage.getItem(key);

      if (value !== null) {
        (config as Record<string, unknown>)[key] = JSON.parse(value);
      }
    } catch {
      // ignored
    }
  }

  return config;
}

function writeLocalConfig(config: Config, defaults: Config) {
  for (const key of ConfigKeys) {
    if (config[key] === defaults[key]) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(config[key]));
    }
  }
}

export default ConfigProvider;
