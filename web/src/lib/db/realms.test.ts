import { describe, expect, it } from "vitest";
import {
  clampRank,
  getCurrencyCap,
  getCurrencyRate,
  getCurrencyRecharge,
  getCurrencyTime,
  roundCurrency,
} from "./realms";

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

  it("tells when it recharges to a value, at the next full hour", () => {
    const currency = { value: 10, time: 1000 };

    // 4 per hour
    expect(getCurrencyTime(currency, 0, 90)).toBe(1000 + 20 * 3600000);
    expect(getCurrencyTime(currency, 0, 91)).toBe(1000 + 21 * 3600000);
    expect(getCurrencyRecharge(0, getCurrencyTime(currency, 0, 91) - currency.time)).toBe(84);
  });

  it("rounds down within the cap", () => {
    expect(roundCurrency(299.9, 1)).toBe(299);
    expect(roundCurrency(500, 1)).toBe(300);
  });
});
