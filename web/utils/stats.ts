import { Dispatch, SetStateAction, useCallback } from "react";
import { DateTime } from "luxon";
import { StatFrame, useConfig } from "./config";
import { ServerResetHour, useServerTime } from "./time";

/** Statistics are grouped by server day, which starts at the daily reset. Returns the start of that day. */
export function getStatFrameTime(time: DateTime) {
  time = time.minus({ hours: ServerResetHour });
  return DateTime.fromObject({ year: time.year, month: time.month, day: time.day });
}

/** Returns the statistics frame for the current server day and a setter for it. */
export function useCurrentStats(): [StatFrame | undefined, Dispatch<SetStateAction<StatFrame>>] {
  const [stats, setStats] = useConfig("stats");
  const frameId = getStatFrameTime(useServerTime(60000)).toISODate();

  const setFrame = useCallback(
    (action: SetStateAction<StatFrame>) => {
      setStats((stats) =>
        stats.map((frame) => (frame.id === frameId ? (typeof action === "function" ? action(frame) : action) : frame)),
      );
    },
    [setStats, frameId],
  );

  return [stats.find((frame) => frame.id === frameId), setFrame];
}
