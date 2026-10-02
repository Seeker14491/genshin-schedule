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

/** Returns the time of the next daily reset after `current`, in the same zone as `current`. */
export function getServerResetTime(current: DateTime) {
  return current
    .startOf("hour")
    .plus({ days: current.hour < ServerResetHour ? 0 : 1 })
    .set({ hour: ServerResetHour });
}

export type TimeUnit = "year" | "week" | "day" | "hour" | "minute" | "second" | "millisecond";
export const TimeUnits: TimeUnit[] = ["year", "week", "day", "hour", "minute", "second", "millisecond"];

// number of each unit in the previous (larger) unit
const TimeUnitSizes: number[] = [52, 7, 24, 60, 60, 1000];

function getUnitMs(unit: TimeUnit) {
  let value = 1;

  for (let i = TimeUnits.indexOf(unit); i < TimeUnitSizes.length; i++) {
    value *= TimeUnitSizes[i];
  }

  return value;
}

/** Returns the largest unit that the duration is at least one of. */
export function getLargestUnit(duration: Duration): TimeUnit {
  const ms = Math.abs(duration.as("milliseconds"));
  return TimeUnits.find((unit) => ms >= getUnitMs(unit)) || "millisecond";
}

/** Formats a time like "04:05" using the given units. */
export function formatTime(time: DateTime, units: Exclude<TimeUnit, "year" | "week">[]) {
  return units.map((unit) => time.get(unit).toString().padStart(2, "0")).join(":");
}

const unitFormats = new Map<string, Intl.NumberFormat>();

// formats e.g. "5 hours" in the given language, using the browser's translations of time units
function formatUnit(locale: string, value: number, unit: TimeUnit) {
  const key = `${locale} ${unit}`;
  let format = unitFormats.get(key);

  if (!format) {
    format = new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "long" });
    unitFormats.set(key, format);
  }

  return format.format(value);
}

/** Formats a duration in a single unit, e.g. "5 hours". */
export function formatDurationPart(locale: string, duration: Duration, unit: TimeUnit) {
  return formatUnit(locale, Math.floor(duration.as(unit)), unit);
}

/** Formats a duration using the given units, omitting zero values, e.g. "2 hours 5 minutes". */
export function formatDuration(locale: string, duration: Duration, units = TimeUnits) {
  const parts: string[] = [];

  for (const unit of units) {
    const unitIndex = TimeUnits.indexOf(unit);
    let value = duration.as(unit);

    // once a larger unit has been printed, only print the remainder of smaller units
    if (parts.length && unitIndex >= 1) {
      value %= TimeUnitSizes[unitIndex - 1];
    }

    value = Math.floor(value);

    if (value) {
      parts.push(formatUnit(locale, value, unit));
    }
  }

  return parts.join(" ");
}
