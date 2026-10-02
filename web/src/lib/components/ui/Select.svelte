<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLSelectAttributes } from "svelte/elements";

  let {
    value = $bindable(),
    children,
    ...rest
  }: { value: string; children: Snippet } & HTMLSelectAttributes = $props();
</script>

<div class="relative flex w-full max-w-xs">
  <select
    class="h-10 w-full min-w-0 appearance-none rounded-sm border border-border bg-transparent ps-3 pe-8 text-style-sm outline-0 focus-visible:border-gray-focus-ring focus-visible:outline-1 focus-visible:outline-gray-focus-ring [&>option]:bg-bg"
    bind:value
    {...rest}
  >
    {@render children()}
  </select>

  <div
    class="pointer-events-none absolute end-2 top-1/2 inline-flex h-full -translate-y-1/2 items-center text-style-lg text-fg-muted"
  >
    <svg
      class="size-[1em]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  </div>
</div>
