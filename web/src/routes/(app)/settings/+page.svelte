<script lang="ts">
  import Settings from "#lib/components/settings/Settings.svelte";
  import { m } from "#lib/paraglide/messages.js";

  let { data } = $props();
</script>

<svelte:head>
  <title>{m.settings()} · {m.genshin_schedule()}</title>
</svelte:head>

<Settings user={data.user} />
