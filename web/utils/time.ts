import { createContext, useContext, useSyncExternalStore } from "react";
import { DateTime, Duration } from "luxon";
import { defineMessages, IntlShape } from "react-intl";
import { Config, useConfig } from "./config";

/** Fixed UTC offsets of each game server. Servers don't observe daylight saving time. */
export const ServerTimeZones: Record<Config["server"], string> = {
  America: "UTC-5",
  Europe: "UTC+1",
  Asia: "UTC+8",
  "TW, HK, MO": "UTC+8",
};

/** Daily reset happens at 4AM server time. */
export const ServerResetHour = 4;

/** Returns the time of the next daily reset after `current`, in the same zone as `current`. */
export function getServerResetTime(current: DateTime) {
  return current
    .startOf("hour")
    .plus({ days: current.hour < ServerResetHour ? 0 : 1 })
    .set({ hour: ServerResetHour });
}

/**
 * Time at which the page was rendered on the server.
 * Used while hydrating so that time-dependent markup matches the server-rendered HTML.
 */
export const RenderTimeContext = createContext(0);

const subscribers = new Map<number, (callback: () => void) => () => void>();

// returns a stable subscribe function that notifies at every multiple of `interval` ms
function subscribeInterval(interval: number) {
  let subscribe = subscribers.get(interval);

  if (!subscribe) {
    subscribe = (callback) => {
      let timeout: ReturnType<typeof setTimeout>;

      const schedule = () => {
        timeout = setTimeout(
          () => {
            callback();
            schedule();
          },
          interval - (Date.now() % interval),
        );
      };

      schedule();
      return () => clearTimeout(timeout);
    };

    subscribers.set(interval, subscribe);
  }

  return subscribe;
}

const currentTime = () => Date.now();

/** Returns the current Unix time in milliseconds, rerendering every `interval` ms. */
export function useNow(interval: number) {
  const renderTime = useContext(RenderTimeContext);

  const tick = useSyncExternalStore(
    subscribeInterval(interval),
    () => Math.floor(currentTime() / interval),
    () => -1,
  );

  // tick is -1 during server rendering and hydration
  return tick === -1 ? renderTime : currentTime();
}

/** Returns the current time in the selected server's time zone, rerendering every `interval` ms. */
export function useServerTime(interval: number) {
  const [server] = useConfig("server");
  return DateTime.fromMillis(useNow(interval), { zone: ServerTimeZones[server] });
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

const durationMessages = defineMessages<Record<TimeUnit, { value: number }>>({
  year: { defaultMessage: "{value, plural, one {# year} other {# years}}" },
  week: { defaultMessage: "{value, plural, one {# week} other {# weeks}}" },
  day: { defaultMessage: "{value, plural, one {# day} other {# days}}" },
  hour: { defaultMessage: "{value, plural, one {# hour} other {# hours}}" },
  minute: { defaultMessage: "{value, plural, one {# minute} other {# minutes}}" },
  second: { defaultMessage: "{value, plural, one {# second} other {# seconds}}" },
  millisecond: { defaultMessage: "{value, plural, one {# millisecond} other {# milliseconds}}" },
});

/** Formats a duration in a single unit, e.g. "5 hours". */
export function formatDurationPart(intl: IntlShape, duration: Duration, unit: TimeUnit) {
  return intl.formatMessage(durationMessages[unit], { value: Math.floor(duration.as(unit)) });
}

/** Formats a duration using the given units, omitting zero values, e.g. "2 hours 5 minutes". */
export function formatDuration(intl: IntlShape, duration: Duration, units = TimeUnits) {
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
      parts.push(intl.formatMessage(durationMessages[unit], { value }));
    }
  }

  return parts.join(" ");
}
