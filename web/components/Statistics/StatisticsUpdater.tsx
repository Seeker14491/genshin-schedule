"use client";

import { useEffect } from "react";
import { StatFrame, useConfig } from "@/utils/config";
import { getStatFrameTime } from "@/utils/stats";
import { useServerTime } from "@/utils/time";

/** Keeps one statistics frame per day for the retention period, dropping older frames. */
const StatisticsUpdater = () => {
  const time = useServerTime(60000);
  const todayId = getStatFrameTime(time).toISODate();
  const [stats, setStats] = useConfig("stats");
  const [retention] = useConfig("statRetention");

  useEffect(() => {
    setStats((stats) => {
      const today = getStatFrameTime(time);
      const result: StatFrame[] = [];

      for (let i = -retention; i <= 0; i++) {
        const time = today.plus({ days: i });
        const frameId = time.toISODate()!;
        const frame = stats.find((stat) => stat.id === frameId);

        result.push(
          frame || {
            id: frameId,
            time: time.valueOf(),
            resinsSpent: 0,
          },
        );
      }

      // avoid notifying subscribers if nothing changed
      return result.length === stats.length && result.every((frame, i) => frame === stats[i]) ? stats : result;
    });
    // only rebuild frames when the day changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayId, stats.length, setStats, retention]);

  return null;
};

export default StatisticsUpdater;
