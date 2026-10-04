<script lang="ts">
  import { formatResinButton, ResinButtonValues, sortResinButtons } from "#lib/db/resin.ts";
  import { config } from "#lib/session.svelte.ts";
  import { m } from "#lib/paraglide/messages.js";

  const selected = $derived(new Set(config.resinCalcButtons));

  // earlier versions of the site allowed other values. They're shown after the others, and disappear when turned off
  const others = $derived(
    sortResinButtons(config.resinCalcButtons.filter((value) => !ResinButtonValues.includes(value))),
  );

  // saved from lowest to highest, the order they're shown in
  function toggle(value: number) {
    config.resinCalcButtons = sortResinButtons(
      selected.has(value) ? config.resinCalcButtons.filter((v) => v !== value) : [...config.resinCalcButtons, value],
    );
  }
</script>

<!-- toggles for the resin calculator buttons. With 9 columns, subtracting and adding are a row each -->
<div class="grid max-w-xs grid-cols-9 gap-1">
  {#each [...ResinButtonValues, ...others] as value (value)}
    <button
      type="button"
      class={[
        "h-9 min-w-0 cursor-pointer rounded-sm border text-style-sm font-medium focus-ring outline-0 transition-colors duration-200 select-none",
        selected.has(value)
          ? "border-blue-solid bg-blue-solid text-white [--focus-ring-color:var(--color-blue-focus-ring)] hover:bg-blue-solid/90"
          : "border-border text-fg-muted hover:bg-gray-subtle",
      ]}
      aria-pressed={selected.has(value)}
      title={value > 0 ? m.add_resin({ amount: value }) : m.subtract_resin({ amount: Math.abs(value) })}
      onclick={() => toggle(value)}
    >
      {formatResinButton(value)}
    </button>
  {/each}
</div>
