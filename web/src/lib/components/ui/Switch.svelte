<script lang="ts">
  import type { Snippet } from "svelte";

  let { checked = $bindable(false), label }: { checked: boolean; label: Snippet } = $props();
</script>

<label class="group inline-flex cursor-pointer flex-col gap-1.5">
  <span class="text-sm leading-none font-medium">{@render label()}</span>
  <input type="checkbox" role="switch" class="peer sr-only" bind:checked />

  <span
    class="relative inline-flex h-5 w-10 shrink-0 items-center rounded-full bg-bg-emphasized p-0.5 transition-colors duration-200 group-has-checked:bg-blue-solid peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-focus-ring"
  >
    <span
      class="size-4 rounded-full bg-white shadow-sm transition-transform duration-200 group-has-checked:translate-x-5"
    ></span>
  </span>
</label>
