<script lang="ts">
  import NotificationSetup from "#lib/components/notifications/NotificationSetup.svelte";
  import { m } from "#lib/paraglide/messages.js";
</script>

<svelte:head>
  <title>{m.notifications()} · {m.genshin_schedule()}</title>
</svelte:head>

<NotificationSetup />
