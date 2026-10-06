import { DateTime, Duration } from "luxon";
import type { Config } from "./config";

/** Fixed UTC offsets of each game server. Servers don't observe daylight saving time. */
export const ServerTimeZones: Record<Config["server"], string> = {
  America: "UTC-5",
  Europe: "UTC+1",
  Asia: "UTC+8",
  "TW, HK, MO": "UTC+8",
};

/** Daily reset happens at 4AM server time. */
export const ServerResetHour = 4;

/** Returns `ms` (Unix time in milliseconds) as a time on the given server. */
export function getServerTime(ms: number, server: Config["server"]) {
  return DateTime.fromMillis(ms, { zone: ServerTimeZones[server] });
}

/** Returns `ms` as a time in the zone times are shown in: the browser's, or the selected server's. */
export function getDisplayTime(ms: number, config: Pick<Config, "timeZone" | "server">) {
  return DateTime.fromMillis(ms, { zone: config.timeZone === "local" ? "system" : ServerTimeZones[config.server] });
}

/** Returns the time of the next daily reset after `current`, in the same zone as `current`. */
export function getServerResetTime(current: DateTime) {
  return current
    .startOf("hour")
    .plus({ days: current.hour < ServerResetHour ? 0 : 1 })
    .set({ hour: ServerResetHour });
}

/**
 * Whether the browser's own locale uses 12-hour time. The site's language isn't enough, since its only English is
 * American English.
 */
export function browserUses12HourTime() {
  const { hourCycle } = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions();
  return hourCycle === "h11" || hourCycle === "h12";
}

export type TimeFormat = {
  /** The language to format in. */
  locale: string;
  /** Whether to use 12-hour time. */
  hour12: boolean;
  /** Whether to show seconds. */
  seconds?: boolean;
  /** Whether to show the date as well, e.g. "10/5/2026, 6:19 AM". */
  date?: boolean;
};

/**
 * Intl options for a time such as "4:05 PM" or "16:05". 24-hour time pads the hour, as is usual. `hour12: false` isn't
 * used for it, since some browsers have shown midnight as "24:00" with it.
 */
function getTimeOptions({ hour12, seconds, date }: TimeFormat): Intl.DateTimeFormatOptions {
  return {
    ...(date && { year: "numeric", month: "numeric", day: "numeric" }),
    ...(hour12 ? { hour12: true, hour: "numeric" } : { hourCycle: "h23", hour: "2-digit" }),
    minute: "2-digit",
    ...(seconds && { second: "2-digit" }),
  };
}

/** Formats a time in its zone, e.g. "4:05 PM" or "16:05", in the given language and 12- or 24-hour time. */
export function formatClockTime(time: DateTime, format: TimeFormat) {
  return time.setLocale(format.locale).toLocaleString(getTimeOptions(format));
}

/** Like `formatClockTime`, but split into parts such as the hour and the AM/PM marker, in the language's order. */
export function formatClockTimeParts(time: DateTime, format: TimeFormat) {
  return time.setLocale(format.locale).toLocaleParts(getTimeOptions(format));
}

/**
 * When something happening at `ms` is shown to happen, and how long until then, for estimates. The time is rounded up
 * to the next whole minute, so that it's never earlier than it really is, and the duration is counted from the start of
 * the current minute, so that both match the clock. `now` gives the time zone.
 */
export function getEstimate(now: DateTime, ms: number) {
  const time = DateTime.fromMillis(Math.ceil(ms / 60000) * 60000, { zone: now.zone });
  return { time, duration: Duration.fromMillis(time.toMillis() - Math.floor(now.toMillis() / 60000) * 60000) };
}

export type ShortDurationUnit = "day" | "hour" | "minute";

const unitFormats = new Map<string, Intl.NumberFormat>();

// formats e.g. "5h" in the given language, using the browser's translations of time units
function formatUnit(locale: string, value: number, unit: ShortDurationUnit) {
  const key = `${locale} ${unit}`;
  let format = unitFormats.get(key);

  if (!format) {
    format = new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "narrow" });
    unitFormats.set(key, format);
  }

  return format.format(value);
}

const durationFormats = new Map<string, Intl.DurationFormat>();

/**
 * Formats a duration compactly using the given units, from largest to smallest, e.g. "2h 56m" or "1d 3h 20m". Values
 * are rounded down, and zero values are left out unless the duration is shorter than the smallest unit.
 */
export function formatShortDuration(locale: string, duration: Duration, units: ShortDurationUnit[]) {
  const values = duration.shiftTo(...units.map((unit) => `${unit}s` as const)).toObject();

  const parts = units
    .map((unit) => ({ unit, value: Math.floor(values[`${unit}s`] ?? 0) }))
    .filter(({ value }) => value !== 0);

  // Intl.DurationFormat leaves out zero values even if they're all zero
  if (!parts.length) {
    return formatUnit(locale, 0, units[units.length - 1]);
  }

  // browsers without Intl.DurationFormat (before 2025) get the short unit names, separated by spaces
  if (typeof Intl.DurationFormat !== "function") {
    return parts.map(({ unit, value }) => formatUnit(locale, value, unit)).join(" ");
  }

  let format = durationFormats.get(locale);

  if (!format) {
    format = new Intl.DurationFormat(locale, { style: "narrow" });
    durationFormats.set(locale, format);
  }

  return format.format(Object.fromEntries(parts.map(({ unit, value }) => [`${unit}s`, value])));
}
