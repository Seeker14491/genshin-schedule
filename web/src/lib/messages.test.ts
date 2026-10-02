import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Languages } from "./languages";

const load = (language: string) =>
  JSON.parse(readFileSync(new URL(`../../messages/${language}.json`, import.meta.url), "utf8")) as Record<
    string,
    unknown
  >;

// names of the parameters used by a message, e.g. {value}, including in plural variants
const parameters = (message: unknown) => [...new Set(JSON.stringify(message).match(/\{\w+\}/g))].sort();

const english = load("en-US");

describe.each(Languages.filter((language) => language !== "en-US"))("%s translation", (language) => {
  const messages = load(language);

  it("has every message, and no others", () => {
    expect(Object.keys(messages).sort()).toEqual(Object.keys(english).sort());
  });

  it("uses the same parameters as English", () => {
    for (const key of Object.keys(english)) {
      expect(parameters(messages[key]), key).toEqual(parameters(english[key]));
    }
  });
});
