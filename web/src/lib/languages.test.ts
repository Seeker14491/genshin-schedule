import { describe, expect, it } from "vitest";
import { isLanguage, matchLanguage } from "./languages";

describe("isLanguage", () => {
  it("accepts the site's languages and nothing else", () => {
    expect(isLanguage("zh-Hans")).toBe(true);
    expect(isLanguage("ja")).toBe(true);
    // Norwegian was available before, but isn't one of the game's languages
    expect(isLanguage("nb-NO")).toBe(false);
    expect(isLanguage("default")).toBe(false);
  });
});

describe("matchLanguage", () => {
  it("returns the first preferred language the site supports", () => {
    expect(matchLanguage(["nb-NO", "de-DE", "en-US"])).toBe("de");
    expect(matchLanguage(["en-GB"])).toBe("en-US");
    expect(matchLanguage(["pt-BR"])).toBe("pt");
    expect(matchLanguage(["in"])).toBe("id");
  });

  it("chooses simplified or traditional Chinese by script or region", () => {
    expect(matchLanguage(["zh-CN"])).toBe("zh-Hans");
    expect(matchLanguage(["zh"])).toBe("zh-Hans");
    expect(matchLanguage(["zh-TW"])).toBe("zh-Hant");
    expect(matchLanguage(["zh-HK"])).toBe("zh-Hant");
    expect(matchLanguage(["zh-Hant-CN"])).toBe("zh-Hant");
  });

  it("returns undefined when nothing matches", () => {
    expect(matchLanguage(["nb-NO", "not a language tag!"])).toBeUndefined();
    expect(matchLanguage([])).toBeUndefined();
  });
});
