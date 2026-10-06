<script lang="ts">
  import { BellIcon } from "@lucide/svelte";
  import {
    addResin,
    getResinAt,
    getResinTime,
    ResinCap,
    ResinMax,
    roundResin,
    sortResinButtons,
  } from "#lib/db/resin.ts";
  import { getDigit, onHotkey } from "#lib/utils/hotkeys.svelte.ts";
  import { formatClockTime, formatShortDuration, getDisplayTime, getEstimate } from "#lib/utils/time.ts";
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

  const resinAt = (ms: number) => getResinAt(config.resin, ms);

  // updated every second, so that resin reaches a value when it's due (e.g. when the Discord notification is sent)
  const time = $derived(getDisplayTime(clock.now, config));
  const current = $derived(resinAt(clock.now));

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

  // e.g. "1h 20m (4:05 PM)"
  function estimateTime(value: number) {
    const estimate = getEstimate(time, getResinTime(config.resin, value));
    const duration = formatShortDuration(locale.current, estimate.duration, ["hour", "minute"]);
    return `${duration} (${formatClockTime(estimate.time, { locale: locale.current, hour12: locale.hour12 })})`;
  }

  /** When resin will reach every multiple of 20 above the current resin, up to the cap. */
  const estimates = $derived.by(() => {
    const result: { duration: string; value: number }[] = [];

    for (let value = 20; value <= ResinCap; value += 20) {
      if (value > current) {
        result.push({ duration: estimateTime(value), value });
      }
    }

    return result;
  });

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
      <img alt={m.resin()} src={ResinIcon} class="size-10 scale-140" />

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
          {#each estimates as { duration, value }, i (i)}
            <div>{m.value_in_duration({ value, duration })}</div>
          {/each}
        </div>
      {/if}

      {#if config.resinNotifyMark !== ResinCap && current < config.resinNotifyMark}
        <div class="flex items-center gap-1 sm:-ms-4">
          <BellIcon size="0.75em" />

          <a href="/home/notifications" class="link">
            {m.value_in_duration({ value: config.resinNotifyMark, duration: estimateTime(config.resinNotifyMark) })}
          </a>
        </div>
      {/if}
    </div>
  </Panel>
</Widget>
