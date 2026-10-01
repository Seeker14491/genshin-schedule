"use client";

import { useState } from "react";
import {
  Button,
  CloseButton,
  Dialog,
  Heading,
  HStack,
  Portal,
  Spacer,
  Stack,
  StackSeparator,
  Stat,
} from "@chakra-ui/react";
import { FormattedDate, FormattedMessage, useIntl } from "react-intl";
import { RepeatIcon } from "lucide-react";
import { Duration } from "luxon";
import { VictoryAxis, VictoryChart, VictoryLine, VictoryTheme } from "victory";
import { ResinsPerMinute } from "@/db/resins";
import { StatFrame, useConfig } from "@/utils/config";
import { useCurrentStats } from "@/utils/stats";
import { formatDurationPart } from "@/utils/time";
import Panel from "../Panel";

const ResinsPerDay = ResinsPerMinute * 60 * 24;

/** Statistics page: resin spending over the retention period. */
const Statistics = () => {
  return (
    <Stack gap={12}>
      <InfoText />

      <Stack gap={4}>
        <Heading size="xl">
          <FormattedMessage defaultMessage="Resins spent" />
        </Heading>

        <Panel divide>
          <HStack align="stretch" gap={0} separator={<StackSeparator />}>
            <TodayPanel />
            <TotalPanel />
            <PeakPanel />
          </HStack>

          <ResinGraph />
        </Panel>
      </Stack>
    </Stack>
  );
};

const InfoText = () => {
  const intl = useIntl();
  const [stats] = useConfig("stats");
  const [retention] = useConfig("statRetention");

  return (
    <HStack align="start" gap={2}>
      <div>
        <p>
          <FormattedMessage defaultMessage="Range" />: {stats[0]?.id}~{stats[stats.length - 1]?.id}
        </p>
        <p>
          <FormattedMessage defaultMessage="Duration" />:{" "}
          {formatDurationPart(intl, Duration.fromObject({ days: retention }), "day")}
        </p>
      </div>

      <Spacer />
      <ResetButton />
    </HStack>
  );
};

const ResetButton = () => {
  const [, setStats] = useConfig("stats");
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root role="alertdialog" open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Dialog.Trigger asChild>
        <Button colorPalette="red">
          <RepeatIcon />
          <FormattedMessage defaultMessage="Reset" />
        </Button>
      </Dialog.Trigger>

      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                <FormattedMessage defaultMessage="Reset statistics" />
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>

            <Dialog.Body>
              <FormattedMessage defaultMessage="This action cannot be undone." />
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                colorPalette="red"
                onClick={() => {
                  setStats([]);
                  setOpen(false);
                }}
              >
                <FormattedMessage defaultMessage="Reset" />
              </Button>

              <Dialog.ActionTrigger asChild>
                <Button variant="subtle">
                  <FormattedMessage defaultMessage="Cancel" />
                </Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

/** Text color from red (no resin spent) to green (all naturally recharged resin spent). */
function efficiencyColor(efficiency: number) {
  const percent = Math.round(Math.max(0, Math.min(1, efficiency)) * 100);
  return `color-mix(in srgb, var(--chakra-colors-green-500) ${percent}%, var(--chakra-colors-red-500))`;
}

const StatPanel = ({
  label,
  value,
  efficiency,
  help,
}: {
  label: React.ReactNode;
  value: number;
  efficiency: number;
  help?: React.ReactNode;
}) => {
  return (
    <Stat.Root flex={1} alignItems="center" textAlign="center">
      <Stat.Label>{label}</Stat.Label>
      <Stat.ValueText my={1}>
        <Heading size={{ base: "3xl", md: "4xl" }} color={efficiencyColor(efficiency)}>
          {value}
        </Heading>
      </Stat.ValueText>
      {help && <Stat.HelpText>{help}</Stat.HelpText>}
    </Stat.Root>
  );
};

const TodayPanel = () => {
  const [stats] = useCurrentStats();
  const value = stats?.resinsSpent || 0;

  return (
    <StatPanel label={<FormattedMessage defaultMessage="Today" />} value={value} efficiency={value / ResinsPerDay} />
  );
};

const TotalPanel = () => {
  const [stats] = useConfig("stats");
  const [retention] = useConfig("statRetention");
  const value = stats.reduce((total, { resinsSpent }) => total + resinsSpent, 0);
  const efficiency = value / (ResinsPerDay * retention);

  return (
    <StatPanel
      label={<FormattedMessage defaultMessage="Total" />}
      value={value}
      efficiency={efficiency}
      help={
        <FormattedMessage defaultMessage="{percent}% efficiency" values={{ percent: Math.round(efficiency * 100) }} />
      }
    />
  );
};

function getPeakFrame(stats: StatFrame[]) {
  let peak: StatFrame | undefined;

  for (const frame of stats) {
    if (frame.resinsSpent && (!peak || frame.resinsSpent >= peak.resinsSpent)) {
      peak = frame;
    }
  }

  return peak;
}

const PeakPanel = () => {
  const [stats] = useConfig("stats");
  const peak = getPeakFrame(stats);
  const value = peak?.resinsSpent || 0;

  return (
    <StatPanel
      label={<FormattedMessage defaultMessage="Peak" />}
      value={value}
      efficiency={value / ResinsPerDay}
      help={
        peak ? (
          // frame IDs are dates; format in UTC so the server and browser agree
          <FormattedDate value={`${peak.id}T00:00:00Z`} timeZone="UTC" />
        ) : (
          <FormattedMessage defaultMessage="Never" />
        )
      }
    />
  );
};

const ResinGraph = () => {
  const [stats] = useConfig("stats");

  // label every other day, ending with today. labels come from frame IDs rather than times,
  // which are in the browser's time zone and would differ when rendered on the server
  const tickValues = stats.filter((_, i) => (stats.length - 1 - i) % 2 === 0).map((frame) => frame.time);
  const labels = new Map(stats.map((frame) => [frame.time, frame.id]));

  return (
    <VictoryChart
      width={1000}
      height={200}
      padding={{ top: 20, left: 40, bottom: 40, right: 20 }}
      theme={VictoryTheme.material}
    >
      <VictoryLine
        data={stats}
        style={{ data: { stroke: "var(--chakra-colors-green-500)" } }}
        x="time"
        y="resinsSpent"
      />

      <VictoryAxis
        tickValues={tickValues}
        tickFormat={(value: number) => {
          const [, month, day] = labels.get(value)?.split("-") || [];
          return month ? `${+month}/${+day}` : "";
        }}
        style={{ tickLabels: { fill: "var(--chakra-colors-fg-muted)" } }}
      />

      <VictoryAxis
        dependentAxis
        domain={{ y: [0, ResinsPerDay] }}
        style={{ tickLabels: { fill: "var(--chakra-colors-fg-muted)" } }}
      />
    </VictoryChart>
  );
};

export default Statistics;
