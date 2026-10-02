<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

<kbd
  class="inline-flex h-5 shrink-0 items-center rounded-sm border border-b-2 border-gray-muted bg-gray-subtle px-1 font-mono text-style-sm font-medium whitespace-nowrap text-gray-fg select-none [word-spacing:-0.5em]"
>
  {@render children()}
</kbd>
