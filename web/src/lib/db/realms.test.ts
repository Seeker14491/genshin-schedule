import { describe, expect, it } from "vitest";
import { clampRank, getCurrencyCap, getCurrencyRate, getCurrencyRecharge, roundCurrency } from "./realms";

describe("realm currency", () => {
  it("looks up the cap by trust rank, clamping the rank", () => {
    expect(getCurrencyCap(1)).toBe(300);
    expect(getCurrencyCap(10)).toBe(2400);
    expect(getCurrencyCap(99)).toBe(2400);
    expect(clampRank(0)).toBe(1);
  });

  it("looks up the hourly rate by adeptal energy", () => {
    expect(getCurrencyRate(0)).toBe(4);
    expect(getCurrencyRate(1999)).toBe(4);
    expect(getCurrencyRate(2000)).toBe(8);
    expect(getCurrencyRate(25000)).toBe(30);
  });

  it("only recharges per full hour", () => {
    expect(getCurrencyRecharge(2000, 3600000 * 2.9)).toBe(16);
  });

  it("rounds down within the cap", () => {
    expect(roundCurrency(299.9, 1)).toBe(299);
    expect(roundCurrency(500, 1)).toBe(300);
  });
});
