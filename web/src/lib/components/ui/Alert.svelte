<script lang="ts">
  import type { Snippet } from "svelte";
  import WarningIcon from "./WarningIcon.svelte";

  let { status, title, children }: { status: "warning" | "error"; title: Snippet; children?: Snippet } = $props();
</script>

<div
  class={[
    "relative flex w-full items-start gap-3 rounded-md p-4 text-style-sm",
    status === "warning" ? "bg-orange-subtle text-orange-fg" : "bg-red-subtle text-red-fg",
  ]}
  role="alert"
>
  <span class="inline-flex size-[1em] shrink-0 items-center justify-center text-style-xl">
    <WarningIcon class="size-full" />
  </span>

  <div class="flex flex-1 flex-col gap-1">
    <div class="font-medium">{@render title()}</div>
    {#if children}
      <div class="inline">{@render children()}</div>
    {/if}
  </div>
</div>
