<script lang="ts">
  import { BellIcon, SettingsIcon } from "@lucide/svelte";
  import { PaimonIcon } from "#lib/assets/index.ts";
  import { m } from "#lib/paraglide/messages.js";
  import Tooltip from "./ui/Tooltip.svelte";
</script>

<nav class="flex items-center gap-2 p-4">
  <a href="/home" class="link shrink-0 font-heading font-bold">
    <span class="flex items-center gap-2">
      <img alt="" src={PaimonIcon} class="size-6 rounded-md" />
      <span class="text-lg">{m.genshin_schedule()}</span>
    </span>
  </a>

  <div class="flex-1"></div>

  <div class="flex items-center gap-4">
    <Tooltip content={m.notifications()}>
      <a href="/home/notifications" class="link" aria-label={m.notifications()}><BellIcon size="1em" /></a>
    </Tooltip>

    <Tooltip content={m.settings()}>
      <a href="/settings" class="link" aria-label={m.settings()}><SettingsIcon size="1em" /></a>
    </Tooltip>
  </div>
</nav>
