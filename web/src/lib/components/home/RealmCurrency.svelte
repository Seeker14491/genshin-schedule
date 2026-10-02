<script lang="ts">
  import { DateTime, Duration } from "luxon";
  import {
    clampEnergy,
    clampRank,
    getCurrencyCap,
    getCurrencyRate,
    getCurrencyRecharge,
    roundCurrency,
  } from "#lib/db/realms.ts";
  import type { Config } from "#lib/utils/config.ts";
  import { formatDuration, formatTime, getServerTime } from "#lib/utils/time.ts";
  import { config } from "#lib/session.svelte.ts";
  import { clock } from "#lib/clock.svelte.ts";
  import { locale } from "#lib/i18n.svelte.ts";
  import { RealmCurrencyIcon } from "#lib/assets/index.ts";
  import { m } from "#lib/paraglide/messages.js";
  import Widget from "./Widget.svelte";
  import HoverReveal from "./HoverReveal.svelte";
  import Panel from "../Panel.svelte";
  import AutoSizeInput from "../AutoSizeInput.svelte";
  import Button from "../ui/Button.svelte";

  const estimateModes: Config["resinEstimateMode"][] = ["time", "value"];

  // currency at a given time. Times before the last change count as the time of the change
  const currencyAt = (ms: number) =>
    config.realmCurrency.value + getCurrencyRecharge(config.realmEnergy, Math.max(0, ms - config.realmCurrency.time));

  const time = $derived(getServerTime(clock.minute, config.server));
  const current = $derived(currencyAt(time.valueOf()));
  const cap = $derived(getCurrencyCap(config.realmRank));
  const rate = $derived(getCurrencyRate(config.realmEnergy));

  // e.g. "10/5/2026, 6:19 AM"
  const formatDate = (date: DateTime) => date.setLocale(locale.current).toLocaleString(DateTime.DATETIME_SHORT);

  /** How much currency there will be after doubling amounts of time, then when it will be full. */
  const estimatesByTime = $derived.by(() => {
    const result: { duration: string; value: number }[] = [];

    const addValue = (hours: number) => {
      const value = roundCurrency(currencyAt(time.plus({ hours }).valueOf()), config.realmRank);

      if (value < cap) {
        result.push({
          duration: formatDuration(locale.current, Duration.fromObject({ hours }), ["day", "hour"]),
          value,
        });
        return true;
      }
    };

    for (let i = 2; addValue(i); i *= 2);

    const remainingTime = Duration.fromObject({ hours: (cap - current) / rate });

    result.push({
      duration: `${formatDuration(locale.current, remainingTime, ["day", "hour"])} (${formatDate(time.plus(remainingTime))})`,
      value: cap,
    });

    return result;
  });

  /** When currency will reach doubling amounts, then the cap. */
  const estimatesByCurrency = $derived.by(() => {
    const result: { duration: string; value: number }[] = [];

    const addValue = (value: number) => {
      const remaining = value - current;

      if (remaining > 0) {
        const remainingTime = Duration.fromObject({ hours: remaining / rate });
        const estimate = time.plus(remainingTime);

        // show the date as well if it's more than a day away
        const estimatedDate =
          estimate.toMillis() > time.plus({ days: 1 }).toMillis()
            ? formatDate(estimate)
            : formatTime(estimate, ["hour", "minute"]);

        result.push({
          duration: `${formatDuration(locale.current, remainingTime, ["day", "hour", "minute"])} (${estimatedDate})`,
          value,
        });
      }
    };

    for (let i = 80; i <= cap; i *= 2) {
      addValue(i);
    }
    addValue(cap);

    return result;
  });
</script>

<Widget type="realm" heading={m.realm_calculator_title()}>
  <Panel>
    <div class="flex items-center gap-2">
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
      <img
        alt={m.realm_currency()}
        title={m.switch_estimation_mode()}
        src={RealmCurrencyIcon}
        class={["size-10 scale-120", current < cap && "cursor-pointer"]}
        onclick={() => {
          if (current < cap) {
            config.resinEstimateMode =
              estimateModes[(estimateModes.indexOf(config.resinEstimateMode) + 1) % estimateModes.length];
          }
        }}
      />

      <div>{m.adeptal_energy()}:</div>

      <AutoSizeInput
        min={0}
        class="text-lg font-bold"
        aria-label={m.adeptal_energy()}
        value={config.realmEnergy}
        onvalue={(value) => (config.realmEnergy = clampEnergy(value || 0))}
      />

      <div class="shrink-0 text-sm text-gray-500">{rate} / {m.hour()}</div>

      <div class="flex-1"></div>

      <HoverReveal>
        {#if current > 0}
          <Button
            size="sm"
            palette="muted"
            title={m.clear_currency()}
            onclick={() => (config.realmCurrency = { value: 0, time: Date.now() })}
          >
            {m.clear()}
          </Button>
        {/if}
      </HoverReveal>
    </div>

    <div class="flex flex-col items-start gap-2 ps-12">
      <div class="flex items-center gap-2">
        <div>{m.trust_rank()}:</div>

        <AutoSizeInput
          min={1}
          max={10}
          class="text-lg font-bold"
          aria-label={m.trust_rank()}
          value={config.realmRank}
          onvalue={(value) => (config.realmRank = clampRank(value || 1))}
        />
      </div>

      <div class="flex items-center gap-2">
        <div>{m.realm_currency()}:</div>

        <AutoSizeInput
          min={0}
          max={cap}
          class="text-lg font-bold"
          aria-label={m.realm_currency()}
          value={roundCurrency(current, config.realmRank)}
          onvalue={(value) =>
            (config.realmCurrency = { value: roundCurrency(value || 0, config.realmRank), time: Date.now() })}
        />

        <div class="shrink-0 text-sm text-gray-500">/ {cap}</div>
      </div>

      <div class="text-sm text-gray-500">
        {#if current >= cap}
          <span class="bg-highlight">{m.realm_full()}</span>
        {:else}
          {#each config.resinEstimateMode === "value" ? estimatesByCurrency : estimatesByTime as { duration, value }, i (i)}
            <div>{m.value_in_duration({ value, duration })}</div>
          {/each}
        {/if}
      </div>
    </div>
  </Panel>
</Widget>
