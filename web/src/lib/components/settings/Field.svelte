<script lang="ts">
  import type { Component, Snippet } from "svelte";

  let {
    id,
    icon: Icon,
    label,
    group = false,
    children,
  }: {
    /** the id of the labeled form field, or of the label if `group` is set */
    id: string;
    icon: Component<{ size?: string }>;
    label: string;
    /** labels a group of controls, e.g. buttons, instead of a single form field */
    group?: boolean;
    children: Snippet;
  } = $props();
</script>

{#snippet text()}
  <span class="flex items-center gap-2"><Icon size="1em" />{label}</span>
{/snippet}

<!-- a labeled setting -->
<div class="flex w-full flex-col items-start gap-1.5">
  {#if group}
    <span {id} class="flex items-center gap-1 text-style-sm font-medium">{@render text()}</span>

    <div role="group" aria-labelledby={id} class="w-full">
      {@render children()}
    </div>
  {:else}
    <label for={id} class="flex items-center gap-1 text-style-sm font-medium">{@render text()}</label>

    {@render children()}
  {/if}
</div>
