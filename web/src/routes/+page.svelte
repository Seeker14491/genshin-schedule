<script lang="ts">
  import AppShell from "#lib/components/AppShell.svelte";
  import Welcome from "#lib/components/welcome/Welcome.svelte";
  import { m } from "#lib/paraglide/messages.js";
</script>

<svelte:head>
  <title>{m.genshin_schedule()}</title>
</svelte:head>

<AppShell header={false}>
  <Welcome />
</AppShell>
