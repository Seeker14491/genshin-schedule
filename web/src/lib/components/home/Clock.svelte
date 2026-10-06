<script lang="ts">
  import { ClockIcon } from "@lucide/svelte";
  import { getResinAt, roundResin } from "#lib/db/resin.ts";
  import { ServerList } from "#lib/utils/config.ts";
  import { splitMessage } from "#lib/utils/message.ts";
  import {
    formatClockTimeParts,
    formatShortDuration,
    getDisplayTime,
    getEstimate,
    getServerResetTime,
    getServerTime,
    ServerTimeZones,
  } from "#lib/utils/time.ts";
  import { config } from "#lib/session.svelte.ts";
  import { clock } from "#lib/clock.svelte.ts";
  import { locale } from "#lib/i18n.svelte.ts";
  import { m } from "#lib/paraglide/messages.js";
  import Tooltip from "../ui/Tooltip.svelte";

  const serverNames = $derived({
    America: m.server_america(),
    Europe: m.server_europe(),
    Asia: m.server_asia(),
    "TW, HK, MO": m.server_tw_hk_mo(),
  });

  const timeParts = $derived(
    formatClockTimeParts(getDisplayTime(clock.now, config), {
      locale: locale.current,
      hour12: locale.hour12,
      seconds: true,
    }),
  );

  // daily reset is always on the server's time, whichever time is shown. The duration matches the clock, like estimates
  const serverTime = $derived(getServerTime(clock.now, config.server));
  const resetTime = $derived(getServerResetTime(serverTime));
  const resetDue = $derived(getEstimate(serverTime, resetTime.toMillis()).duration);
  const resetResin = $derived(roundResin(getResinAt(config.resin, resetTime.toMillis())));

  // the current server day, which starts at reset rather than at midnight
  const weekday = $derived(resetTime.minus({ days: 1 }).setLocale(locale.current).toFormat("cccc"));

  // e.g. "America server: Thursday, 2h 16m until reset (117 resin)", with the server as a button
  const resetMessage = $derived(
    splitMessage(
      (values) =>
        m.server_reset({
          weekday,
          duration: formatShortDuration(locale.current, resetDue, ["hour", "minute"]),
          value: resetResin,
          ...values,
        }),
      ["server"],
    ),
  );
</script>

<!-- the current time, and the time until daily reset on the selected server -->
<dl class="flex flex-col items-center gap-1 text-center">
  <dt class="flex items-center gap-1.5 text-style-sm text-fg-muted">
    <div class="flex items-center justify-center gap-2 text-md">
      <ClockIcon size="1em" />
      <div>{config.timeZone === "local" ? m.local_time() : m.time_in_teyvat()}</div>
    </div>
  </dt>

  <dd class="my-1 flex gap-1 text-style-2xl font-semibold tracking-tight">
    <!--
      the heading font's digits differ in width, so each one gets a box as wide as the widest (0), to keep the clock from
      moving every second. The parts are separate boxes, so the heading is named after the whole time
    -->
    <h2
      class="flex items-baseline font-heading text-style-3xl font-semibold md:text-style-4xl"
      aria-label={timeParts.map((part) => part.value).join("")}
    >
      {#each timeParts as part, i (i)}
        {#if part.type === "dayPeriod"}
          <span class="text-[0.5em] leading-none">{part.value}</span>
        {:else if part.type === "literal"}
          <span class="whitespace-pre">{part.value}</span>
        {:else}
          {#each part.value as digit, j (j)}
            <span class="w-[0.75em] text-center">{digit}</span>
          {/each}
        {/if}
      {/each}
    </h2>
  </dd>

  <dd class="text-style-xs text-fg-muted">
    {#each resetMessage as part, i (i)}
      {#if "text" in part}
        {part.text}
      {:else}
        <Tooltip closeOnClick={false}>
          {#snippet content()}
            {m.switch_server()} (<code>{ServerTimeZones[config.server]}</code>)
          {/snippet}

          <button
            type="button"
            class="link font-bold"
            onclick={() => (config.server = ServerList[(ServerList.indexOf(config.server) + 1) % ServerList.length])}
          >
            {m.server_label({ server: serverNames[config.server] })}
          </button>
        </Tooltip>
      {/if}
    {/each}
  </dd>
</dl>
