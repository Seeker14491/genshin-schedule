"use client";

import { Heading, HStack, Link, Stat } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { ClockIcon } from "lucide-react";
import { getResinRecharge, roundResin } from "@/db/resins";
import { ServerList, useConfig } from "@/utils/config";
import { formatDurationPart, getLargestUnit, getServerResetTime, ServerTimeZones, useServerTime } from "@/utils/time";
import { Tooltip } from "../ui/tooltip";

/** Shows the current time on the selected server and the time until daily reset. */
const Clock = () => {
  return (
    <Stat.Root alignItems="center" textAlign="center">
      <Stat.Label>
        <HStack fontSize="md" gap={2} justify="center">
          <ClockIcon size="1em" />
          <div>
            <FormattedMessage defaultMessage="Time in Teyvat" /> (<ServerText />)
          </div>
        </HStack>
      </Stat.Label>

      <Stat.ValueText my={1}>
        <TimeDisplay />
      </Stat.ValueText>

      <Stat.HelpText>
        <DateDisplay />
      </Stat.HelpText>
    </Stat.Root>
  );
};

const ServerText = () => {
  const [server, setServer] = useConfig("server");
  const { formatMessage } = useIntl();

  const names = {
    America: formatMessage({ defaultMessage: "America" }),
    Europe: formatMessage({ defaultMessage: "Europe" }),
    Asia: formatMessage({ defaultMessage: "Asia" }),
    "TW, HK, MO": formatMessage({ defaultMessage: "TW, HK, MO" }),
  };

  return (
    <Tooltip
      content={
        <>
          <FormattedMessage defaultMessage="Switch server" /> (<code>{ServerTimeZones[server]}</code>)
        </>
      }
      closeOnClick={false}
    >
      <Link
        as="button"
        fontWeight="bold"
        onClick={() => setServer(ServerList[(ServerList.indexOf(server) + 1) % ServerList.length])}
      >
        {names[server]}
      </Link>
    </Tooltip>
  );
};

const TimeDisplay = () => {
  const time = useServerTime(1000);

  return (
    <Heading size={{ base: "3xl", md: "4xl" }} fontVariantNumeric="tabular-nums">
      {time.toFormat("HH:mm:ss")}
    </Heading>
  );
};

const DateDisplay = () => {
  const intl = useIntl();
  const time = useServerTime(1000);

  const resetTime = getServerResetTime(time);
  const resetDue = resetTime.diff(time);
  const resetResins = roundResin(getResinRecharge(resetDue.valueOf()));

  // the current server day is the day before the next reset
  const weekday = resetTime.minus({ days: 1 }).setLocale(intl.locale).toFormat("cccc");

  return (
    <div>
      {weekday},{" "}
      <FormattedMessage
        defaultMessage="{duration} until reset"
        values={{ duration: formatDurationPart(intl, resetDue, getLargestUnit(resetDue)) }}
      />{" "}
      (+
      <FormattedMessage
        defaultMessage="{value, plural, one {# resin} other {# resins}}"
        values={{ value: resetResins }}
      />
      )
    </div>
  );
};

export default Clock;
