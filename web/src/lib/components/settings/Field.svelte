<script lang="ts">
  import type { Component, Snippet } from "svelte";

  let {
    id,
    icon: Icon,
    label,
    children,
  }: { id: string; icon: Component<{ size?: string }>; label: string; children: Snippet } = $props();
</script>

<!-- a labeled setting -->
<div class="flex w-full flex-col items-start gap-1.5">
  <label for={id} class="flex items-center gap-1 text-style-sm font-medium">
    <span class="flex items-center gap-2"><Icon size="1em" />{label}</span>
  </label>

  {@render children()}
</div>
