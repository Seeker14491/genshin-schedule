<script lang="ts">
  import Clock from "#lib/components/home/Clock.svelte";
  import Resin from "#lib/components/home/Resin.svelte";
  import RealmCurrency from "#lib/components/home/RealmCurrency.svelte";
  import { m } from "#lib/paraglide/messages.js";
</script>

<svelte:head>
  <title>{m.genshin_schedule()}</title>
</svelte:head>

<div class="flex flex-col gap-16">
  <Clock />
  <Resin />
  <RealmCurrency />
</div>
