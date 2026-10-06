import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DateTime, Duration } from "luxon";
import {
  formatClockTime,
  formatClockTimeParts,
  formatShortDuration,
  getDisplayTime,
  getEstimate,
  getServerResetTime,
  ServerTimeZones,
} from "./time";

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

describe("getDisplayTime", () => {
  const ms = Date.parse("2026-07-01T12:00:00Z");

  it("uses the browser's time zone for local time", () => {
    const time = getDisplayTime(ms, { timeZone: "local", server: "Europe" });

    expect(time.zone.type).toBe("system");
    expect(time.toMillis()).toBe(ms);
  });

  it("uses the server's fixed offset for server time", () => {
    expect(getDisplayTime(ms, { timeZone: "server", server: "Europe" }).toISO()).toBe("2026-07-01T13:00:00.000+01:00");
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

describe("formatShortDuration", () => {
  const format = (locale: string, minutes: number, units: Parameters<typeof formatShortDuration>[2]) =>
    formatShortDuration(locale, Duration.fromObject({ minutes }), units);

  it("formats the given units compactly, skipping zero values", () => {
    expect(format("en-US", 176, ["hour", "minute"])).toBe("2h 56m");
    expect(format("en-US", 240, ["hour", "minute"])).toBe("4h");
    expect(format("en-US", 45, ["hour", "minute"])).toBe("45m");
    expect(format("en-US", 27 * 60 + 20, ["day", "hour", "minute"])).toBe("1d 3h 20m");
    expect(format("en-US", 1600, ["hour", "minute"])).toBe("26h 40m");
  });

  it("rounds down, and shows 0 of the smallest unit for shorter durations", () => {
    expect(format("en-US", 59.9, ["hour", "minute"])).toBe("59m");
    expect(format("en-US", 0.5, ["hour", "minute"])).toBe("0m");
  });

  it("formats in the given language", () => {
    expect(format("fr", 176, ["hour", "minute"])).toBe("2h 56min");
    expect(format("ru", 176, ["hour", "minute"])).toBe("2 ч 56 мин");
  });

  describe("without Intl.DurationFormat", () => {
    const original = Intl.DurationFormat;

    beforeEach(() => void Reflect.deleteProperty(Intl, "DurationFormat"));
    afterEach(() => void Object.defineProperty(Intl, "DurationFormat", { value: original, configurable: true }));

    it("uses the short unit names, separated by spaces", () => {
      expect(format("en-US", 176, ["hour", "minute"])).toBe("2h 56m");
      expect(format("en-US", 27 * 60 + 20, ["day", "hour", "minute"])).toBe("1d 3h 20m");
      expect(format("fr", 176, ["hour", "minute"])).toBe("2h 56min");
    });
  });
});

// browsers and Node use different spaces, e.g. before "PM"
const normalizeSpaces = (text: string) => text.replace(/\s/g, " ");

describe("formatClockTime", () => {
  const afternoon = DateTime.fromISO("2026-10-01T16:05:09", { zone: "UTC" });
  const midnight = DateTime.fromISO("2026-10-01T00:05:09", { zone: "UTC" });
  const format = (time: DateTime, format: Parameters<typeof formatClockTime>[1]) =>
    normalizeSpaces(formatClockTime(time, format));

  it("formats 24-hour time with a 2-digit hour", () => {
    expect(format(afternoon, { locale: "en-US", hour12: false })).toBe("16:05");
    expect(format(midnight, { locale: "en-US", hour12: false })).toBe("00:05");
    expect(format(midnight, { locale: "en-US", hour12: false, seconds: true })).toBe("00:05:09");
    expect(format(afternoon, { locale: "ko", hour12: false, seconds: true })).toBe("16:05:09");
  });

  it("formats 12-hour time in each language's way", () => {
    expect(format(afternoon, { locale: "en-US", hour12: true })).toBe("4:05 PM");
    expect(format(midnight, { locale: "en-US", hour12: true, seconds: true })).toBe("12:05:09 AM");
    expect(format(afternoon, { locale: "ko", hour12: true })).toBe("오후 4:05");
    expect(format(afternoon, { locale: "ja", hour12: true })).toBe("午後4:05");
  });

  it("shows the date if asked to", () => {
    expect(format(afternoon, { locale: "en-US", hour12: true, date: true })).toBe("10/1/2026, 4:05 PM");
    expect(format(afternoon, { locale: "de", hour12: false, date: true })).toBe("1.10.2026, 16:05");
  });

  it("formats in the time's zone", () => {
    expect(format(afternoon.setZone("UTC+1"), { locale: "en-US", hour12: false })).toBe("17:05");
  });
});

describe("formatClockTimeParts", () => {
  const time = DateTime.fromISO("2026-10-01T16:05:09", { zone: "UTC" });
  const types = (locale: string, hour12: boolean) =>
    formatClockTimeParts(time, { locale, hour12, seconds: true })
      .map((part) => part.type)
      .filter((type) => type !== "literal");

  it("splits the time into its parts, in the language's order", () => {
    expect(types("en-US", false)).toEqual(["hour", "minute", "second"]);
    expect(types("en-US", true)).toEqual(["hour", "minute", "second", "dayPeriod"]);
    expect(types("ko", true)).toEqual(["dayPeriod", "hour", "minute", "second"]);
  });
});

describe("getEstimate", () => {
  const now = DateTime.fromISO("2026-10-01T14:00:40", { zone: "UTC+1" });

  it("rounds the time up to the minute, and counts the duration from the start of the current minute", () => {
    const { time, duration } = getEstimate(now, DateTime.fromISO("2026-10-01T15:20:18", { zone: "UTC+1" }).toMillis());

    expect(time.toISO()).toBe("2026-10-01T15:21:00.000+01:00");
    expect(duration.as("minutes")).toBe(81);
  });

  it("keeps times that are on a whole minute", () => {
    const { time, duration } = getEstimate(now, DateTime.fromISO("2026-10-01T15:20:00", { zone: "UTC+1" }).toMillis());

    expect(time.toISO()).toBe("2026-10-01T15:20:00.000+01:00");
    expect(duration.as("minutes")).toBe(80);
  });

  it("is at least a minute away for times later in the current minute", () => {
    const { duration } = getEstimate(now, now.plus({ seconds: 5 }).toMillis());

    expect(duration.as("minutes")).toBe(1);
  });
});
