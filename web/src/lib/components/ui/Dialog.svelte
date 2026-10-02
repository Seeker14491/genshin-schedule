<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLFormAttributes } from "svelte/elements";
  import CloseIcon from "./CloseIcon.svelte";
  import Button from "./Button.svelte";
  import { m } from "#lib/paraglide/messages.js";

  let {
    open = $bindable(false),
    title,
    children,
    footer,
    onsubmit,
    alert = false,
  }: {
    open: boolean;
    title: Snippet;
    children: Snippet;
    footer?: Snippet;
    /** wraps the body and footer in a form with this submit handler */
    onsubmit?: HTMLFormAttributes["onsubmit"];
    /** for dialogs that ask the user to confirm something */
    alert?: boolean;
  } = $props();

  const id = $props.id();
  let dialog: HTMLDialogElement;

  $effect(() => {
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });
</script>

{#snippet body()}
  <div class="flex-1 px-6 pt-2 pb-6">{@render children()}</div>

  {#if footer}
    <div class="flex items-center justify-end gap-3 px-6 pt-2 pb-4">{@render footer()}</div>
  {/if}
{/snippet}

<!-- the dialog element covers the whole page; clicking outside the content closes it -->
<dialog
  bind:this={dialog}
  role={alert ? "alertdialog" : "dialog"}
  aria-labelledby="{id}-title"
  class="dialog fixed inset-0 m-0 flex h-dvh max-h-none w-dvw max-w-none justify-center overflow-y-auto overscroll-y-none bg-transparent p-0 text-fg not-open:hidden"
  onclose={() => (open = false)}
  onclick={(e) => {
    if (e.target === dialog) open = false;
  }}
>
  <div
    class="dialog-content relative mx-auto my-16 flex h-fit w-full max-w-2xl flex-col rounded-md bg-bg text-style-sm shadow-lg"
  >
    <div class="flex flex-none gap-2 px-6 pt-6 pb-4">
      <h2 id="{id}-title" class="text-style-lg font-semibold">{@render title()}</h2>
    </div>

    <div class="absolute end-2 top-2">
      <Button variant="ghost" size="icon" aria-label={m.close()} onclick={() => (open = false)}>
        <CloseIcon />
      </Button>
    </div>

    {#if onsubmit}
      <form class="flex flex-1 flex-col" {onsubmit}>{@render body()}</form>
    {:else}
      {@render body()}
    {/if}
  </div>
</dialog>

<style>
  .dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.36);
    animation: fade-in 300ms;
  }

  .dialog[open] .dialog-content {
    animation:
      scale-in 200ms cubic-bezier(0, 0, 0.2, 1),
      fade-in 200ms cubic-bezier(0, 0, 0.2, 1);
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }

  @keyframes scale-in {
    from {
      scale: 0.95;
    }
  }
</style>
