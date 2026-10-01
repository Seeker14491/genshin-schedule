import { describe, expect, it } from "vitest";
import { clampResin, getResinRecharge, parseResinButtons, ResinCap, roundResin } from "./resins";

describe("resin", () => {
  it("recharges one resin every 8 minutes", () => {
    expect(getResinRecharge(8 * 60000)).toBe(1);
    expect(getResinRecharge(ResinCap * 8 * 60000)).toBe(ResinCap);
  });

  it("clamps and rounds down to the cap", () => {
    expect(clampResin(-5)).toBe(0);
    expect(clampResin(ResinCap + 1)).toBe(ResinCap);
    expect(roundResin(19.99)).toBe(19);
    expect(roundResin(ResinCap + 0.5)).toBe(ResinCap);
  });
});

describe("parseResinButtons", () => {
  it("parses signed multiples of ten", () => {
    expect(parseResinButtons("-40, -30,-20 , +10, 10")).toEqual([-40, -30, -20, 10, 10]);
  });

  it("ignores invalid values", () => {
    expect(parseResinButtons("abc, 15, -20, 9000, ")).toEqual([-20]);
    expect(parseResinButtons("")).toEqual([]);
  });
});
