"use client";

import { useMemo } from "react";
import NextLink from "next/link";
import { Box, Button, ButtonGroup, ButtonProps, chakra, HStack, Link, Stack, StackSeparator } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { BellIcon } from "lucide-react";
import { DateTime, Duration } from "luxon";
import { clampResin, getResinRecharge, ResinCap, ResinsPerMinute, roundResin } from "@/db/resins";
import { Config, useConfig } from "@/utils/config";
import { useCurrentStats } from "@/utils/stats";
import { formatDuration, formatDurationPart, formatTime, useServerTime } from "@/utils/time";
import { useHotkey } from "@/utils/hotkeys";
import { ResinIcon } from "@/assets";
import Widget, { HoverReveal } from "./Widget";
import Panel from "../Panel";
import AutoSizeInput from "../AutoSizeInput";
import ResinNotification from "./ResinNotification";

const estimateModes: Config["resinEstimateMode"][] = ["time", "value"];

/** Resin calculator: tracks the user's resin and estimates when it will recharge. */
const Resin = () => {
  const { formatMessage } = useIntl();
  const [resin, setResin] = useConfig("resin");
  const [, setStats] = useCurrentStats();
  const [mode, setMode] = useConfig("resinEstimateMode");
  const [notifyMark] = useConfig("resinNotifyMark");

  const time = useServerTime(60000);
  const current = resin.value + getResinRecharge(time.valueOf() - resin.time);

  return (
    <Widget type="resin" heading={<FormattedMessage defaultMessage="Resin Calculator" />}>
      <ResinNotification />

      <Panel>
        {/*
          phones: the icon and buttons share the first row, and the counter gets a row of its own below them.
          wider screens: everything is on one row; wrap-reverse makes the buttons wrap above the counter if they don't fit
        */}
        <HStack gap={2} flexWrap={{ base: "wrap", sm: "wrap-reverse" }}>
          <chakra.img
            alt="Resin"
            title={formatMessage({ defaultMessage: "Switch estimation mode" })}
            src={ResinIcon.src}
            w={10}
            h={10}
            cursor={current < ResinCap ? "pointer" : undefined}
            transform="scale(1.4)"
            onClick={() => {
              if (current < ResinCap) {
                setMode((mode) => estimateModes[(estimateModes.indexOf(mode) + 1) % estimateModes.length]);
              }
            }}
          />

          <HStack gap={2} order={{ base: 1, sm: 0 }} w={{ base: "full", sm: "auto" }}>
            <AutoSizeInput
              min={0}
              max={ResinCap}
              fontSize="xl"
              fontWeight="bold"
              aria-label={formatMessage({ defaultMessage: "Resin" })}
              value={roundResin(current)}
              onChange={({ currentTarget: { valueAsNumber } }) => {
                const oldValue = roundResin(current);
                const newValue = roundResin(valueAsNumber || 0);

                setResin({
                  value: newValue,
                  time: time.valueOf(),
                });

                setStats((stats) => ({ ...stats, resinsSpent: roundResin(stats.resinsSpent - newValue + oldValue) }));
              }}
            />

            <Box flexShrink={0} fontSize="sm" color="gray.500">
              / {ResinCap}
            </Box>
          </HStack>

          <Box ml="auto">
            <HoverReveal>
              <SideButtons current={current} />
            </HoverReveal>
          </Box>
        </HStack>

        {/* indented to line up with the counter, which is only next to the icon on wider screens */}
        <Stack gap={2} color="gray.500" pl={{ base: 0, sm: 12 }} fontSize="sm" separator={<StackSeparator />}>
          {current >= ResinCap ? (
            <chakra.span bg={{ base: "yellow.100", _dark: "yellow.900" }} alignSelf="start">
              <FormattedMessage defaultMessage="Your resins are full." />
            </chakra.span>
          ) : mode === "value" ? (
            <EstimatorByResin />
          ) : (
            <EstimatorByTime />
          )}

          {notifyMark !== ResinCap && current < notifyMark && (
            <HStack gap={1} ml={{ base: 0, sm: -4 }}>
              <BellIcon size="0.75em" />

              <Link asChild>
                <NextLink href="/home/notifications/queue">
                  <EstimatorByNotifyMark />
                </NextLink>
              </Link>
            </HStack>
          )}
        </Stack>
      </Panel>
    </Widget>
  );
};

/** Buttons for adding or subtracting resin, with keyboard shortcuts. */
const SideButtons = ({ current }: { current: number }) => {
  const time = useServerTime(1000);
  const [, setResin] = useConfig("resin");
  const [buttons] = useConfig("resinCalcButtons");
  const [, setStats] = useCurrentStats();

  // unavailable buttons must be left out rather than rendered as null,
  // because the group counts its children to find the first and last button
  const available = buttons.filter((delta) => {
    // round down without clamping, because we need to check for extremities
    const rounded = Math.floor(current + delta);

    // if addition, don't overflow; if subtraction, don't underflow
    return (delta < 0 && rounded >= 0) || (delta > 0 && rounded <= ResinCap);
  });

  return (
    <ButtonGroup attached size="sm" variant="subtle">
      {available.map((delta) => (
        <SideButton
          key={delta}
          value={delta}
          onClick={() => {
            setResin((resin) => ({
              value: clampResin(clampResin(resin.value + getResinRecharge(time.valueOf() - resin.time)) + delta),
              time: time.valueOf(),
            }));

            if (delta < 0) {
              setStats((stats) => ({ ...stats, resinsSpent: stats.resinsSpent - delta }));
            }
          }}
        />
      ))}
    </ButtonGroup>
  );
};

/** Other props are passed to the button, because the attached group styles its buttons through injected props. */
const SideButton = ({
  value,
  onClick,
  ...props
}: { value: number; onClick: () => void } & Omit<ButtonProps, "value" | "onClick">) => {
  const { formatMessage } = useIntl();

  // two-digit multiples of ten get a shortcut: the first digit subtracts, shift + the first digit adds.
  // event.code is used because shift changes event.key (e.g. shift+2 is "@" on US keyboards)
  const digit = Math.abs(value) < 100 && value % 10 === 0 ? Math.abs(value).toString()[0] : undefined;

  useHotkey(
    (e) => (e.code === `Digit${digit}` || e.code === `Numpad${digit}`) && e.shiftKey === value > 0,
    onClick,
    digit !== undefined,
  );

  return (
    <Button
      {...props}
      color="gray.500"
      px={2}
      onClick={onClick}
      title={
        value > 0
          ? formatMessage({ defaultMessage: "Add {amount} resins" }, { amount: value })
          : formatMessage({ defaultMessage: "Subtract {amount} resins" }, { amount: Math.abs(value) })
      }
    >
      {value > 0 ? `+${value}` : `${value}`}
    </Button>
  );
};

/** Shows how much resin there will be after some time. */
const EstimatorByTime = () => {
  const intl = useIntl();
  const [resin] = useConfig("resin");
  const time = useServerTime(60000);

  const values = useMemo(() => {
    const result: { capTime: Duration; value: number; full?: boolean }[] = [];

    const addValue = (hours: number) => {
      const resins = roundResin(resin.value + getResinRecharge(time.plus({ hours }).valueOf() - resin.time));

      if (resins < ResinCap) {
        result.push({ capTime: Duration.fromObject({ hours }), value: resins });
        return true;
      }
    };

    addValue(2);
    for (let i = 4; addValue(i) && i < 24; i += 4);

    const capTime = DateTime.fromMillis(resin.time)
      .plus({ minutes: (ResinCap - resin.value) / ResinsPerMinute })
      .diff(time);

    result.push({ capTime, value: ResinCap, full: true });

    return result;
  }, [resin, time]);

  return (
    <div>
      {values.map(({ capTime, value, full }) => (
        <div key={capTime.valueOf()}>
          <FormattedMessage
            defaultMessage="{value} in {duration}"
            values={{
              value,
              duration: full
                ? `${formatDuration(intl, capTime, ["hour", "minute"])} (${formatTime(time.plus(capTime), ["hour", "minute"])})`
                : formatDurationPart(intl, capTime, "hour"),
            }}
          />
        </div>
      ))}
    </div>
  );
};

/** Shows when resin will reach every multiple of 20. */
const EstimatorByResin = () => {
  const intl = useIntl();
  const [resin] = useConfig("resin");
  const time = useServerTime(60000);

  const values = useMemo(() => {
    const result: { remainingTime: Duration; value: number }[] = [];

    for (let value = 20; value <= ResinCap; value += 20) {
      const remainingResins = value - (resin.value + getResinRecharge(time.valueOf() - resin.time));

      if (remainingResins > 0) {
        result.push({ remainingTime: Duration.fromObject({ minutes: remainingResins / ResinsPerMinute }), value });
      }
    }

    return result;
  }, [resin, time]);

  return (
    <div>
      {values.map(({ remainingTime, value }) => (
        <div key={remainingTime.valueOf()}>
          <FormattedMessage
            defaultMessage="{value} in {time}"
            values={{
              value,
              time: `${formatDuration(intl, remainingTime, ["hour", "minute"])} (${formatTime(time.plus(remainingTime), ["hour", "minute"])})`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

/** Shows when the resin notification will be sent. */
const EstimatorByNotifyMark = () => {
  const intl = useIntl();
  const time = useServerTime(60000);
  const [resin] = useConfig("resin");
  const [notifyMark] = useConfig("resinNotifyMark");

  const remainingResins = notifyMark - (resin.value + getResinRecharge(time.valueOf() - resin.time));
  const remainingTime = Duration.fromObject({ minutes: remainingResins / ResinsPerMinute });

  return (
    <FormattedMessage
      defaultMessage="{value} in {time}"
      values={{
        value: notifyMark,
        time: `${formatDuration(intl, remainingTime, ["hour", "minute"])} (${formatTime(time.plus(remainingTime), ["hour", "minute"])})`,
      }}
    />
  );
};

export default Resin;
