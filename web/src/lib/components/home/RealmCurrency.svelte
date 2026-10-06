<script lang="ts">
  import {
    clampEnergy,
    clampRank,
    getCurrencyCap,
    getCurrencyRate,
    getCurrencyRecharge,
    getCurrencyTime,
    roundCurrency,
  } from "#lib/db/realms.ts";
  import { formatClockTime, formatShortDuration, getDisplayTime, getEstimate } from "#lib/utils/time.ts";
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

  // currency at a given time. Times before the last change count as the time of the change
  const currencyAt = (ms: number) =>
    config.realmCurrency.value + getCurrencyRecharge(config.realmEnergy, Math.max(0, ms - config.realmCurrency.time));

  // updated every second, like resin
  const time = $derived(getDisplayTime(clock.now, config));
  const current = $derived(currencyAt(clock.now));
  const cap = $derived(getCurrencyCap(config.realmRank));
  const rate = $derived(getCurrencyRate(config.realmEnergy));

  /** When currency will reach doubling amounts, then the cap, e.g. "1d 3h 20m (10/5/2026, 6:19 AM)". */
  const estimates = $derived.by(() => {
    const result: { duration: string; value: number }[] = [];

    const addValue = (value: number) => {
      if (value > current) {
        const estimate = getEstimate(time, getCurrencyTime(config.realmCurrency, config.realmEnergy, value));
        const duration = formatShortDuration(locale.current, estimate.duration, ["day", "hour", "minute"]);

        // show the date as well if it's more than a day away
        const date = estimate.time.toMillis() > time.plus({ days: 1 }).toMillis();

        result.push({
          duration: `${duration} (${formatClockTime(estimate.time, { locale: locale.current, hour12: locale.hour12, date })})`,
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
      <img alt={m.realm_currency()} src={RealmCurrencyIcon} class="size-10 scale-120" />

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
          {#each estimates as { duration, value }, i (i)}
            <div>{m.value_in_duration({ value, duration })}</div>
          {/each}
        {/if}
      </div>
    </div>
  </Panel>
</Widget>
