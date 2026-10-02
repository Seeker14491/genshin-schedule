import { overwriteGetLocale } from "./paraglide/runtime.js";
import { isLanguage, type Language, matchLanguage } from "./languages";
import { config } from "./session.svelte";

const browserLanguage: Language = matchLanguage(navigator.languages) ?? "en-US";

/** The language the site is shown in: the language setting, or the browser's language if it's "default". */
export const locale = {
  get current(): Language {
    return isLanguage(config.language) ? config.language : browserLanguage;
  },
};

// messages (`m.*()`) read the locale from the config, so the page updates as soon as the setting changes
overwriteGetLocale(() => locale.current);
