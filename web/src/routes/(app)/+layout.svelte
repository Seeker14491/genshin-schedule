<script lang="ts">
  import type { Snippet } from "svelte";
  import AppShell from "#lib/components/AppShell.svelte";

  let { children }: { children: Snippet } = $props();
</script>

<AppShell>
  {@render children()}
</AppShell>
