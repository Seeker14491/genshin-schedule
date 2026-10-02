<script lang="ts">
  import type { Snippet } from "svelte";

  let { divide = false, children }: { divide?: boolean; children: Snippet } = $props();
</script>

<!-- bordered container used for widgets. With `divide`, children are separated by lines -->
<div
  class={[
    "flex flex-col rounded-md border border-border bg-bg p-4",
    divide && "[&>*+*]:mt-4 [&>*+*]:border-t [&>*+*]:border-border [&>*+*]:pt-4",
  ]}
>
  {@render children()}
</div>
