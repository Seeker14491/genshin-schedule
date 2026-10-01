import { describe, expect, it } from "vitest";
import { DateTime, Duration } from "luxon";
import { createIntl } from "react-intl";
import {
  formatDuration,
  formatDurationPart,
  formatTime,
  getLargestUnit,
  getServerResetTime,
  ServerTimeZones,
} from "./time";

const intl = createIntl({ locale: "en-US", onError: () => {} });

// implementation before the 2026 rewrite, kept to check that the new one behaves identically
function legacyGetServerResetTime(current: DateTime) {
  const utc = current.toUTC();

  return DateTime.utc(utc.year, utc.month, utc.day, utc.hour)
    .setZone(current.zone)
    .plus({ days: current.hour < 4 ? 0 : 1 })
    .set({ hour: 4 });
}

describe("ServerTimeZones", () => {
  it("uses each server's fixed UTC offset", () => {
    expect(ServerTimeZones).toEqual({
      America: "UTC-5",
      Europe: "UTC+1",
      Asia: "UTC+8",
      "TW, HK, MO": "UTC+8",
    });
  });
});

describe("getServerResetTime", () => {
  it("returns 4AM today before the reset", () => {
    const time = DateTime.fromISO("2026-03-08T03:59:59", { zone: "UTC-5" });
    expect(getServerResetTime(time).toISO()).toBe("2026-03-08T04:00:00.000-05:00");
  });

  it("returns 4AM tomorrow at or after the reset", () => {
    expect(getServerResetTime(DateTime.fromISO("2026-03-08T04:00:00", { zone: "UTC+8" })).toISO()).toBe(
      "2026-03-09T04:00:00.000+08:00",
    );
    expect(getServerResetTime(DateTime.fromISO("2026-12-31T23:30:00", { zone: "UTC+1" })).toISO()).toBe(
      "2027-01-01T04:00:00.000+01:00",
    );
  });

  it("matches the previous implementation", () => {
    const start = DateTime.utc(2026, 1, 1).toMillis();

    for (const zone of new Set(Object.values(ServerTimeZones))) {
      // every 37 minutes for a year, so that all times of day are covered
      for (let ms = start; ms < start + 365 * 86400000; ms += 37 * 60000) {
        const time = DateTime.fromMillis(ms, { zone });
        expect(getServerResetTime(time).toMillis()).toBe(legacyGetServerResetTime(time).toMillis());
      }
    }
  });
});

describe("getLargestUnit", () => {
  it("returns the largest unit the duration contains", () => {
    expect(getLargestUnit(Duration.fromObject({ hours: 5, minutes: 3 }))).toBe("hour");
    expect(getLargestUnit(Duration.fromObject({ minutes: 59 }))).toBe("minute");
    expect(getLargestUnit(Duration.fromObject({ days: 8 }))).toBe("week");
    expect(getLargestUnit(Duration.fromObject({ minutes: -90 }))).toBe("hour");
    expect(getLargestUnit(Duration.fromMillis(0))).toBe("millisecond");
  });
});

describe("formatDuration", () => {
  it("formats the given units, skipping zero values", () => {
    expect(formatDuration(intl, Duration.fromObject({ minutes: 125 }), ["hour", "minute"])).toBe("2 hours 5 minutes");
    expect(formatDuration(intl, Duration.fromObject({ minutes: 45 }), ["hour", "minute"])).toBe("45 minutes");
    expect(formatDuration(intl, Duration.fromObject({ hours: 1 }), ["hour", "minute"])).toBe("1 hour");
    expect(formatDuration(intl, Duration.fromObject({ hours: 50 }), ["day", "hour"])).toBe("2 days 2 hours");
  });

  it("doesn't wrap the largest printed unit", () => {
    expect(formatDuration(intl, Duration.fromObject({ minutes: 150 }), ["minute"])).toBe("150 minutes");
  });

  it("returns an empty string for durations below the smallest unit", () => {
    expect(formatDuration(intl, Duration.fromObject({ seconds: 30 }), ["hour", "minute"])).toBe("");
  });
});

describe("formatDurationPart", () => {
  it("formats a single unit, rounding down", () => {
    expect(formatDurationPart(intl, Duration.fromObject({ minutes: 119 }), "hour")).toBe("1 hour");
    expect(formatDurationPart(intl, Duration.fromObject({ days: 28 }), "day")).toBe("28 days");
  });
});

describe("formatTime", () => {
  it("pads each unit to two digits", () => {
    expect(formatTime(DateTime.fromISO("2026-01-01T04:05:06", { zone: "UTC" }), ["hour", "minute"])).toBe("04:05");
  });
});
