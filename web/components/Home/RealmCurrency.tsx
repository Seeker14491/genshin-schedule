"use client";

import { useMemo } from "react";
import { Box, Button, chakra, HStack, Spacer, Stack } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { DateTime, Duration } from "luxon";
import {
  clampEnergy,
  clampRank,
  getCurrencyCap,
  getCurrencyRate,
  getCurrencyRecharge,
  roundCurrency,
} from "@/db/realms";
import { Config, useConfig } from "@/utils/config";
import { formatDuration, formatTime, useServerTime } from "@/utils/time";
import { RealmCurrencyIcon } from "@/assets";
import Widget, { HoverReveal } from "./Widget";
import Panel from "../Panel";
import AutoSizeInput from "../AutoSizeInput";

const estimateModes: Config["resinEstimateMode"][] = ["time", "value"];

/** Realm currency calculator: estimates when the Serenitea Pot's currency will be full. */
const RealmCurrency = () => {
  const { formatMessage } = useIntl();
  const [currency, setCurrency] = useConfig("realmCurrency");
  const [rank, setRank] = useConfig("realmRank");
  const [energy, setEnergy] = useConfig("realmEnergy");
  const [mode, setMode] = useConfig("resinEstimateMode");

  const time = useServerTime(60000);
  const current = currency.value + getCurrencyRecharge(energy, time.valueOf() - currency.time);
  const cap = getCurrencyCap(rank);

  return (
    <Widget type="realm" heading={<FormattedMessage defaultMessage="Realm Currency Calculator" />}>
      <Panel>
        <HStack gap={2}>
          <chakra.img
            alt="Realm Currency"
            title={formatMessage({ defaultMessage: "Switch estimation mode" })}
            src={RealmCurrencyIcon.src}
            cursor={current < cap ? "pointer" : undefined}
            onClick={() => {
              if (current < cap) {
                setMode((mode) => estimateModes[(estimateModes.indexOf(mode) + 1) % estimateModes.length]);
              }
            }}
            w={10}
            h={10}
            transform="scale(1.2)"
          />

          <Box fontSize="md">
            <FormattedMessage defaultMessage="Adeptal energy" />:
          </Box>

          <AutoSizeInput
            min={0}
            fontSize="lg"
            fontWeight="bold"
            aria-label={formatMessage({ defaultMessage: "Adeptal energy" })}
            value={energy}
            onChange={({ currentTarget: { valueAsNumber } }) => setEnergy(clampEnergy(valueAsNumber || 0))}
          />

          <Box flexShrink={0} fontSize="sm" color="gray.500">
            {getCurrencyRate(energy)} / <FormattedMessage defaultMessage="Hour" />
          </Box>

          <Spacer />

          <HoverReveal>
            {current > 0 && (
              <Button
                color="gray.500"
                size="sm"
                variant="subtle"
                onClick={() => setCurrency({ value: 0, time: time.valueOf() })}
                title={formatMessage({ defaultMessage: "Clear currency" })}
              >
                <FormattedMessage defaultMessage="Clear" />
              </Button>
            )}
          </HoverReveal>
        </HStack>

        <Stack gap={2} pl={12} align="start">
          <HStack gap={2}>
            <Box fontSize="md">
              <FormattedMessage defaultMessage="Trust rank" />:
            </Box>

            <AutoSizeInput
              min={1}
              max={10}
              fontSize="lg"
              fontWeight="bold"
              aria-label={formatMessage({ defaultMessage: "Trust rank" })}
              value={rank}
              onChange={({ currentTarget: { valueAsNumber } }) => setRank(clampRank(valueAsNumber || 1))}
            />
          </HStack>

          <HStack gap={2}>
            <Box fontSize="md">
              <FormattedMessage defaultMessage="Realm currency" />:
            </Box>

            <AutoSizeInput
              min={0}
              max={cap}
              fontSize="lg"
              fontWeight="bold"
              aria-label={formatMessage({ defaultMessage: "Realm currency" })}
              value={roundCurrency(current, rank)}
              onChange={({ currentTarget: { valueAsNumber } }) => {
                setCurrency({
                  value: roundCurrency(valueAsNumber || 0, rank),
                  time: time.valueOf(),
                });
              }}
            />

            <Box flexShrink={0} fontSize="sm" color="gray.500">
              / {cap}
            </Box>
          </HStack>

          <Box color="gray.500" fontSize="sm">
            {current >= cap ? (
              <chakra.span bg={{ base: "yellow.100", _dark: "yellow.900" }}>
                <FormattedMessage defaultMessage="Your realm currency is full." />
              </chakra.span>
            ) : mode === "value" ? (
              <EstimatorByCurrency />
            ) : (
              <EstimatorByTime />
            )}
          </Box>
        </Stack>
      </Panel>
    </Widget>
  );
};

/** Shows how much currency there will be after doubling amounts of time. */
const EstimatorByTime = () => {
  const intl = useIntl();
  const [currency] = useConfig("realmCurrency");
  const [energy] = useConfig("realmEnergy");
  const [rank] = useConfig("realmRank");
  const time = useServerTime(60000);

  const values = useMemo(() => {
    const result: { capTime: Duration; value: number; full?: boolean }[] = [];
    const cap = getCurrencyCap(rank);

    const addValue = (hours: number) => {
      const value = roundCurrency(
        currency.value + getCurrencyRecharge(energy, time.plus({ hours }).valueOf() - currency.time),
        rank,
      );

      if (value < cap) {
        result.push({ capTime: Duration.fromObject({ hours }), value });
        return true;
      }
    };

    for (let i = 2; addValue(i); i *= 2);

    const remainingCurrency = cap - (currency.value + getCurrencyRecharge(energy, time.valueOf() - currency.time));
    const remainingTime = Duration.fromObject({ hours: remainingCurrency / getCurrencyRate(energy) });

    result.push({ capTime: remainingTime, value: cap, full: true });

    return result;
  }, [currency, energy, rank, time]);

  return (
    <>
      {values.map(({ capTime, value, full }) => (
        <div key={capTime.valueOf()}>
          <FormattedMessage
            defaultMessage="{value} in {duration}"
            values={{
              value,
              duration: full
                ? `${formatDuration(intl, capTime, ["day", "hour"])} (${time
                    .plus(capTime)
                    .setLocale(intl.locale)
                    .toLocaleString(DateTime.DATETIME_SHORT)})`
                : formatDuration(intl, capTime, ["day", "hour"]),
            }}
          />
        </div>
      ))}
    </>
  );
};

/** Shows when currency will reach doubling amounts. */
const EstimatorByCurrency = () => {
  const intl = useIntl();
  const [currency] = useConfig("realmCurrency");
  const [energy] = useConfig("realmEnergy");
  const [rank] = useConfig("realmRank");
  const time = useServerTime(60000);

  const values = useMemo(() => {
    const result: { remainingTime: Duration; value: number }[] = [];
    const cap = getCurrencyCap(rank);

    const addValue = (value: number) => {
      const remainingCurrency = value - (currency.value + getCurrencyRecharge(energy, time.valueOf() - currency.time));

      if (remainingCurrency > 0) {
        result.push({
          remainingTime: Duration.fromObject({ hours: remainingCurrency / getCurrencyRate(energy) }),
          value,
        });
      }
    };

    for (let i = 80; i <= cap; i *= 2) {
      addValue(i);
    }
    addValue(cap);

    return result;
  }, [currency, energy, rank, time]);

  return (
    <>
      {values.map(({ remainingTime, value }) => {
        const estimate = time.plus(remainingTime);

        // show the date as well if it's more than a day away
        const estimatedDate =
          estimate.toMillis() > time.plus({ days: 1 }).toMillis()
            ? estimate.setLocale(intl.locale).toLocaleString(DateTime.DATETIME_SHORT)
            : formatTime(estimate, ["hour", "minute"]);

        return (
          <div key={remainingTime.valueOf()}>
            <FormattedMessage
              defaultMessage="{value} in {time}"
              values={{
                value,
                time: `${formatDuration(intl, remainingTime, ["day", "hour", "minute"])} (${estimatedDate})`,
              }}
            />
          </div>
        );
      })}
    </>
  );
};

export default RealmCurrency;
