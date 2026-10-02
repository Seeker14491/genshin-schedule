/** Languages the site is translated into, as stored in the `language` setting. The game's 15 text languages. */
export const Languages = [
  "en-US",
  "zh-Hans",
  "zh-Hant",
  "ja",
  "ko",
  "es",
  "fr",
  "ru",
  "th",
  "vi",
  "de",
  "id",
  "pt",
  "tr",
  "it",
] as const;

export type Language = (typeof Languages)[number];

export const LanguageNames: Record<Language, string> = {
  "en-US": "English",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
  ja: "日本語",
  ko: "한국어",
  es: "Español",
  fr: "Français",
  ru: "Русский",
  th: "ไทย",
  vi: "Tiếng Việt",
  de: "Deutsch",
  id: "Bahasa Indonesia",
  pt: "Português",
  tr: "Türkçe",
  it: "Italiano",
};

export function isLanguage(value: unknown): value is Language {
  return Languages.includes(value as Language);
}

/**
 * Returns the first of the browser's preferred languages (e.g. `navigator.languages`) that the site supports.
 * Regions are ignored except for Chinese, where they decide between simplified and traditional characters.
 */
export function matchLanguage(preferred: readonly string[]): Language | undefined {
  for (const tag of preferred) {
    let locale: Intl.Locale;

    try {
      locale = new Intl.Locale(tag);
    } catch {
      continue;
    }

    if (locale.language === "zh") {
      const traditional =
        locale.script === "Hant" || (!locale.script && ["TW", "HK", "MO"].includes(locale.region ?? ""));

      return traditional ? "zh-Hant" : "zh-Hans";
    }

    if (locale.language === "en") {
      return "en-US";
    }

    // Indonesian used to have the code "in"
    const language = locale.language === "in" ? "id" : locale.language;

    if (isLanguage(language)) {
      return language;
    }
  }
}
