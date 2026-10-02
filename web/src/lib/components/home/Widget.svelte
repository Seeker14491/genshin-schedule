<script lang="ts">
  import type { Snippet } from "svelte";
  import { slide } from "svelte/transition";
  import { ChevronRightIcon } from "@lucide/svelte";
  import type { Config } from "#lib/utils/config.ts";
  import { config, updateConfig } from "#lib/session.svelte.ts";

  let { type, heading, children }: { type: keyof Config["hiddenWidgets"]; heading: string; children: Snippet } =
    $props();

  const id = $props.id();
  const open = $derived(!config.hiddenWidgets[type]);
</script>

<!-- collapsible home page section. Whether it's collapsed is saved in the config -->
<div>
  <button
    type="button"
    class={[
      "flex cursor-pointer items-center gap-2 rounded-xs font-heading text-xl font-bold whitespace-pre focus-ring hover:underline",
      !open && "text-gray-200 dark:text-gray-700",
    ]}
    aria-expanded={open}
    aria-controls={id}
    onclick={() => updateConfig("hiddenWidgets", (widgets) => ({ ...widgets, [type]: open }))}
  >
    {heading}<ChevronRightIcon
      size="1em"
      class="transition-transform duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] {open ? 'rotate-90' : ''}"
    />
  </button>

  {#if open}
    <div {id} transition:slide={{ duration: 200 }}>
      <div class="group mt-4">
        {@render children()}
      </div>
    </div>
  {/if}
</div>
