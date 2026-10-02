<script lang="ts">
  import { fly } from "svelte/transition";
  import CloseIcon from "./CloseIcon.svelte";
  import WarningIcon from "./WarningIcon.svelte";
  import { toaster } from "./toaster.svelte";
  import { m } from "#lib/paraglide/messages.js";
</script>

<div
  class="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-end gap-4 md:inset-x-auto md:end-4"
  role="region"
  aria-live="polite"
>
  {#each toaster.toasts as toast (toast.id)}
    <div
      class="pointer-events-auto relative flex w-full items-start gap-3 rounded-sm bg-red-solid py-4 ps-4 pe-6 text-white shadow-xl md:w-sm"
      role="alert"
      transition:fly={{ y: -24, duration: 400 }}
    >
      <WarningIcon class="size-5 shrink-0" />

      <div class="flex max-w-full flex-1 flex-col gap-1">
        <div class="me-2 text-style-sm font-medium">{toast.title}</div>
        {#if toast.description}
          <div class="text-style-sm opacity-80">{toast.description}</div>
        {/if}
      </div>

      <button
        type="button"
        class="absolute end-1 top-1 inline-flex items-center justify-center rounded-sm p-1 text-style-md text-white/60 [&_svg]:size-[1em]"
        aria-label={m.close()}
        onclick={() => toaster.dismiss(toast.id)}
      >
        <CloseIcon />
      </button>
    </div>
  {/each}
</div>
