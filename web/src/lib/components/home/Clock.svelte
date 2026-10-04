<script lang="ts">
  import { ClockIcon } from "@lucide/svelte";
  import { getResinRecharge, roundResin } from "#lib/db/resin.ts";
  import { ServerList } from "#lib/utils/config.ts";
  import {
    formatDurationPart,
    getLargestUnit,
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

  const time = $derived(getServerTime(clock.now, config.server));
  const resetTime = $derived(getServerResetTime(time));
  const resetDue = $derived(resetTime.diff(time));

  // the current server day is the day before the next reset
  const weekday = $derived(resetTime.minus({ days: 1 }).setLocale(locale.current).toFormat("cccc"));
</script>

<!-- the current time on the selected server and the time until daily reset -->
<dl class="flex flex-col items-center gap-1 text-center">
  <dt class="flex items-center gap-1.5 text-style-sm text-fg-muted">
    <div class="flex items-center justify-center gap-2 text-md">
      <ClockIcon size="1em" />
      <div>
        {m.time_in_teyvat()} (<Tooltip closeOnClick={false}>
          {#snippet content()}
            {m.switch_server()} (<code>{ServerTimeZones[config.server]}</code>)
          {/snippet}

          <button
            type="button"
            class="link font-bold"
            onclick={() => (config.server = ServerList[(ServerList.indexOf(config.server) + 1) % ServerList.length])}
          >
            {serverNames[config.server]}
          </button>
        </Tooltip>)
      </div>
    </div>
  </dt>

  <dd class="my-1 flex gap-1 text-style-2xl font-semibold tracking-tight">
    <h2 class="font-heading text-style-3xl font-semibold tabular-nums md:text-style-4xl">
      {time.toFormat("HH:mm:ss")}
    </h2>
  </dd>

  <dd class="text-style-xs text-fg-muted">
    {weekday}, {m.until_reset({ duration: formatDurationPart(locale.current, resetDue, getLargestUnit(resetDue)) })}
    ({m.resin_gain({ value: roundResin(getResinRecharge(resetDue.valueOf())) })})
  </dd>
</dl>
