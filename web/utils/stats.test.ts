import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import { getStatFrameTime } from "./stats";

describe("getStatFrameTime", () => {
  it("counts times before the daily reset towards the previous day", () => {
    expect(getStatFrameTime(DateTime.fromISO("2026-10-02T03:59", { zone: "UTC-5" })).toISODate()).toBe("2026-10-01");
    expect(getStatFrameTime(DateTime.fromISO("2026-10-02T04:00", { zone: "UTC-5" })).toISODate()).toBe("2026-10-02");
  });
});
