import { describe, expect, it } from "vitest";
import {
  addResin,
  clampResin,
  formatResinButton,
  getResinAt,
  getResinRecharge,
  getResinTime,
  ResinCap,
  ResinMax,
  roundResin,
  sortResinButtons,
} from "./resin";

const Minute = 60000;

describe("resin", () => {
  it("recharges one resin every 8 minutes", () => {
    expect(getResinRecharge(8 * Minute)).toBe(1);
    expect(getResinRecharge(ResinCap * 8 * Minute)).toBe(ResinCap);
  });

  it("recharges up to the cap", () => {
    const resin = { value: 100, time: 0 };

    expect(getResinAt(resin, 80 * Minute)).toBe(110);
    expect(getResinAt(resin, 1000 * 8 * Minute)).toBe(ResinCap);

    // times before the last change count as the time of the change
    expect(getResinAt(resin, -80 * Minute)).toBe(100);
  });

  it("tells when it recharges to a value", () => {
    const resin = { value: 100.5, time: 1000 };

    expect(getResinTime(resin, 110)).toBe(1000 + 76 * Minute);
    expect(getResinAt(resin, getResinTime(resin, ResinCap))).toBe(ResinCap);
  });

  it("doesn't recharge above the cap", () => {
    expect(getResinAt({ value: 250, time: 0 }, 80 * Minute)).toBe(250);
    expect(getResinAt({ value: ResinCap, time: 0 }, 80 * Minute)).toBe(ResinCap);
  });

  it("clamps and rounds down to the maximum", () => {
    expect(clampResin(-5)).toBe(0);
    expect(clampResin(ResinCap + 1)).toBe(ResinCap + 1);
    expect(clampResin(ResinMax + 1)).toBe(ResinMax);
    expect(roundResin(19.99)).toBe(19);
    expect(roundResin(ResinMax + 0.5)).toBe(ResinMax);
  });
});

describe("addResin", () => {
  it("adds and subtracts, keeping progress towards the next resin below the cap", () => {
    expect(addResin(100.5, -20)).toBe(80.5);
    expect(addResin(100.5, 20)).toBe(120.5);
  });

  it("goes above the cap, dropping the progress towards the next resin", () => {
    expect(addResin(199.5, 60)).toBe(259);
    expect(addResin(190.5, 10)).toBe(ResinCap);
    expect(addResin(ResinMax - 60, 60)).toBe(ResinMax);
  });

  it("refuses to go below 0 or above the maximum", () => {
    expect(addResin(19.9, -20)).toBeUndefined();
    expect(addResin(20, -20)).toBe(0);
    expect(addResin(ResinMax - 50, 60)).toBeUndefined();
  });
});

describe("resin buttons", () => {
  it("are sorted from lowest to highest, without duplicates", () => {
    expect(sortResinButtons([10, -20, 60, -20, -100])).toEqual([-100, -20, 10, 60]);
    expect(sortResinButtons([])).toEqual([]);
  });

  it("show a sign", () => {
    expect(formatResinButton(-20)).toBe("-20");
    expect(formatResinButton(60)).toBe("+60");
  });
});
