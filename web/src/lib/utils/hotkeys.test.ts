import { describe, expect, it } from "vitest";
import { getDigit } from "./hotkeys.svelte";

const key = (code: string, key: string) => ({ code, key }) as KeyboardEvent;

describe("getDigit", () => {
  it("reads 1-9 on the number row, whatever shift types", () => {
    expect(getDigit(key("Digit1", "1"))).toBe(1);
    expect(getDigit(key("Digit2", "@"))).toBe(2);
    expect(getDigit(key("Digit9", "("))).toBe(9);
  });

  it("reads 1-9 on the number pad only while it types digits", () => {
    expect(getDigit(key("Numpad6", "6"))).toBe(6);
    expect(getDigit(key("Numpad6", "ArrowRight"))).toBeUndefined();
  });

  it("ignores other keys", () => {
    expect(getDigit(key("Digit0", "0"))).toBeUndefined();
    expect(getDigit(key("Numpad0", "0"))).toBeUndefined();
    expect(getDigit(key("KeyK", "k"))).toBeUndefined();
  });
});
