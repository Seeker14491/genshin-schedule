import { overwriteGetLocale } from "./paraglide/runtime.js";
import { isLanguage, type Language, matchLanguage } from "./languages";
import { browserUses12HourTime } from "./utils/time";
import { config } from "./session.svelte";

const browserLanguage: Language = matchLanguage(navigator.languages) ?? "en-US";

export const locale = {
  /** The language the site is shown in: the language setting, or the browser's language if it's "default". */
  get current(): Language {
    return isLanguage(config.language) ? config.language : browserLanguage;
  },

  /** Whether times are shown in 12-hour time, which follows the browser's locale rather than the site's language. */
  hour12: browserUses12HourTime(),
};

// messages (`m.*()`) read the locale from the config, so the page updates as soon as the setting changes
overwriteGetLocale(() => locale.current);
