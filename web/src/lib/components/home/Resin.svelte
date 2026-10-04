<script lang="ts">
  import { BellIcon } from "@lucide/svelte";
  import { DateTime, Duration } from "luxon";
  import {
    addResin,
    getResinAt,
    ResinCap,
    ResinMax,
    ResinPerMinute,
    roundResin,
    sortResinButtons,
  } from "#lib/db/resin.ts";
  import type { Config } from "#lib/utils/config.ts";
  import { getDigit, onHotkey } from "#lib/utils/hotkeys.svelte.ts";
  import { formatDuration, formatDurationPart, formatTime, getServerTime } from "#lib/utils/time.ts";
  import { config } from "#lib/session.svelte.ts";
  import { clock } from "#lib/clock.svelte.ts";
  import { locale } from "#lib/i18n.svelte.ts";
  import { ResinIcon } from "#lib/assets/index.ts";
  import { m } from "#lib/paraglide/messages.js";
  import Widget from "./Widget.svelte";
  import HoverReveal from "./HoverReveal.svelte";
  import ResinButton from "./ResinButton.svelte";
  import ResinNotification from "./ResinNotification.svelte";
  import Panel from "../Panel.svelte";
  import AutoSizeInput from "../AutoSizeInput.svelte";

  const estimateModes: Config["resinEstimateMode"][] = ["time", "value"];

  const resinAt = (ms: number) => getResinAt(config.resin, ms);

  const time = $derived(getServerTime(clock.minute, config.server));
  const current = $derived(resinAt(clock.minute));

  // from lowest to highest, even if saved in another order. Buttons that would go below 0 or above the maximum are left out
  const buttons = $derived(
    sortResinButtons(config.resinCalcButtons).filter((delta) => addResin(current, delta) !== undefined),
  );

  // 1-9 subtract 10-90 resin, and add it while holding shift, whichever buttons there are.
  // They only work while the resin calculator is open, so that resin doesn't change without the user seeing it
  onHotkey(
    (e) => getDigit(e) !== undefined,
    (e) => {
      const amount = getDigit(e)! * 10;
      changeResin(e.shiftKey ? amount : -amount);
    },
    () => !config.hiddenWidgets.resin,
  );

  /** How much resin there will be after some time: 2 hours, then every 4 hours up to 24, then when full. */
  const estimatesByTime = $derived.by(() => {
    const result: { duration: string; value: number }[] = [];

    const addValue = (hours: number) => {
      const value = roundResin(resinAt(time.plus({ hours }).valueOf()));

      if (value < ResinCap) {
        result.push({
          duration: formatDurationPart(locale.current, Duration.fromObject({ hours }), "hour"),
          value,
        });
        return true;
      }
    };

    addValue(2);
    for (let i = 4; addValue(i) && i < 24; i += 4);

    const capTime = DateTime.fromMillis(config.resin.time)
      .plus({ minutes: (ResinCap - config.resin.value) / ResinPerMinute })
      .diff(time);

    result.push({
      duration: `${formatDuration(locale.current, capTime, ["hour", "minute"])} (${formatTime(time.plus(capTime), ["hour", "minute"])})`,
      value: ResinCap,
    });

    return result;
  });

  /** When resin will reach every multiple of 20. */
  const estimatesByValue = $derived.by(() => {
    const result: { duration: string; value: number }[] = [];

    for (let value = 20; value <= ResinCap; value += 20) {
      const remaining = value - resinAt(time.valueOf());

      if (remaining > 0) {
        result.push({ duration: estimateTime(remaining), value });
      }
    }

    return result;
  });

  // e.g. "1 hour 20 minutes (04:05)"
  function estimateTime(amount: number) {
    const remaining = Duration.fromObject({ minutes: amount / ResinPerMinute });
    return `${formatDuration(locale.current, remaining, ["hour", "minute"])} (${formatTime(time.plus(remaining), ["hour", "minute"])})`;
  }

  /** Adds resin (or subtracts it, if `delta` is negative), unless that would go below 0 or above the maximum. */
  function changeResin(delta: number) {
    const now = Date.now();
    const value = addResin(resinAt(now), delta);

    if (value !== undefined) {
      config.resin = { value, time: now };
    }
  }
</script>

<Widget type="resin" heading={m.resin_calculator_title()}>
  <ResinNotification />

  <Panel>
    <!--
      phones: the icon and buttons share the first row, and the counter gets a row of its own below them.
      wider screens: everything is on one row; wrap-reverse makes the buttons wrap above the counter if they don't fit
    -->
    <div class="flex flex-wrap items-center gap-2 sm:flex-wrap-reverse">
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
      <img
        alt={m.resin()}
        title={m.switch_estimation_mode()}
        src={ResinIcon}
        class={["size-10 scale-140", current < ResinCap && "cursor-pointer"]}
        onclick={() => {
          if (current < ResinCap) {
            config.resinEstimateMode =
              estimateModes[(estimateModes.indexOf(config.resinEstimateMode) + 1) % estimateModes.length];
          }
        }}
      />

      <div class="order-1 flex w-full items-center gap-2 sm:order-none sm:w-auto">
        <AutoSizeInput
          min={0}
          max={ResinMax}
          class="text-xl font-bold"
          aria-label={m.resin()}
          value={roundResin(current)}
          onvalue={(value) => (config.resin = { value: roundResin(value || 0), time: Date.now() })}
        />

        <div class="shrink-0 text-sm text-gray-500">/ {ResinCap}</div>
      </div>

      <div class="ms-auto">
        <HoverReveal>
          <!-- attached buttons: inner corners are square, and borders overlap -->
          <div
            class="inline-flex items-center [&>*:not(:first-child)]:rounded-s-none [&>*:not(:last-child)]:-me-px [&>*:not(:last-child)]:rounded-e-none"
          >
            {#each buttons as delta (delta)}
              <ResinButton {delta} onclick={() => changeResin(delta)} />
            {/each}
          </div>
        </HoverReveal>
      </div>
    </div>

    <!-- indented to line up with the counter, which is only next to the icon on wider screens -->
    <div
      class="flex flex-col text-sm text-gray-500 sm:ps-12 [&>*+*]:mt-2 [&>*+*]:border-t [&>*+*]:border-border [&>*+*]:pt-2"
    >
      {#if current >= ResinCap}
        <span class="self-start bg-highlight">{m.resin_full()}</span>
      {:else}
        <div>
          {#each config.resinEstimateMode === "value" ? estimatesByValue : estimatesByTime as { duration, value }, i (i)}
            <div>{m.value_in_duration({ value, duration })}</div>
          {/each}
        </div>
      {/if}

      {#if config.resinNotifyMark !== ResinCap && current < config.resinNotifyMark}
        <div class="flex items-center gap-1 sm:-ms-4">
          <BellIcon size="0.75em" />

          <a href="/home/notifications" class="link">
            {m.value_in_duration({
              value: config.resinNotifyMark,
              duration: estimateTime(config.resinNotifyMark - current),
            })}
          </a>
        </div>
      {/if}
    </div>
  </Panel>
</Widget>
