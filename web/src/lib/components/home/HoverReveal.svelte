<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

<!-- only shows its children while the widget is hovered or focused, or always on touch screens -->
<div
  class="opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 [@media(any-pointer:coarse)]:opacity-100"
>
  {@render children()}
</div>
