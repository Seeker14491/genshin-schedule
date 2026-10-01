"use client";

import { useMemo } from "react";
import { useIntl } from "react-intl";
import { DateTime } from "luxon";
import { ResinCap, ResinsPerMinute } from "@/db/resins";
import { useConfig } from "@/utils/config";
import { useApiNotification } from "@/utils/notifications";
import { useServerTime } from "@/utils/time";
import { ResinIcon } from "@/assets";

// color of the Discord message embed
const NotificationColor = "#63b3ed";

/** Queues a Discord notification for when resin reaches the configured amount. */
const ResinNotification = () => {
  const { formatMessage } = useIntl();
  const time = useServerTime(60000);
  const [resin] = useConfig("resin");
  const [notifyMark] = useConfig("resinNotifyMark");

  const capTime = DateTime.fromMillis(resin.time)
    .plus({ minutes: (notifyMark - resin.value) / ResinsPerMinute })
    .valueOf();

  useApiNotification(
    useMemo(
      () => ({
        key: "resin",
        time: capTime,
        icon: ResinIcon.src,
        title: formatMessage({ defaultMessage: "Resin recharged" }),
        description:
          notifyMark === ResinCap
            ? formatMessage({ defaultMessage: "Your resins have fully recharged!" })
            : formatMessage({ defaultMessage: "You have {value} resins right now!" }, { value: notifyMark }),
        url: "/home",
        color: NotificationColor,
      }),
      // the message is only updated when the time changes
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [capTime, notifyMark],
    ),
    time.valueOf() < capTime,
  );

  return null;
};

export default ResinNotification;
