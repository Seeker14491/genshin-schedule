<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    content,
    closeOnClick = true,
    children,
  }: {
    /** shown when hovering or focusing the children */
    content: string | Snippet;
    closeOnClick?: boolean;
    children: Snippet;
  } = $props();

  const OpenDelay = 400;
  const CloseDelay = 150;
  const Gutter = 8;

  let wrapper: HTMLSpanElement;
  let popup: HTMLDivElement | undefined = $state();
  let open = $state(false);
  let timeout: ReturnType<typeof setTimeout>;

  function show(delay: number) {
    clearTimeout(timeout);
    timeout = setTimeout(() => (open = true), delay);
  }

  function hide(delay: number) {
    clearTimeout(timeout);
    timeout = setTimeout(() => (open = false), delay);
  }

  // places the popup below the trigger (above if there isn't room), within the viewport
  $effect(() => {
    if (!open || !popup) return;

    popup.showPopover();

    const trigger = (wrapper.firstElementChild ?? wrapper).getBoundingClientRect();
    const { width, height } = popup.getBoundingClientRect();
    const left = Math.min(
      Math.max(trigger.left + trigger.width / 2 - width / 2, Gutter),
      window.innerWidth - width - Gutter,
    );
    const below = trigger.bottom + Gutter;
    const top = below + height > window.innerHeight ? trigger.top - Gutter - height : below;

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
  });
</script>

<span
  bind:this={wrapper}
  class="contents"
  role="presentation"
  onpointerenter={(e) => e.pointerType !== "touch" && show(OpenDelay)}
  onpointerleave={() => hide(CloseDelay)}
  onfocusin={(e) => (e.target as HTMLElement).matches(":focus-visible") && show(0)}
  onfocusout={() => hide(0)}
  onclick={() => closeOnClick && hide(0)}
  onkeydown={(e) => e.key === "Escape" && hide(0)}
>
  {@render children()}{#if open}<div
      bind:this={popup}
      popover="manual"
      role="tooltip"
      class="tooltip fixed m-0 max-w-xs rounded-sm border-0 bg-bg-inverted px-2.5 py-1 text-style-xs font-medium text-fg-inverted shadow-md"
    >
      {#if typeof content === "string"}{content}{:else}{@render content()}{/if}
    </div>{/if}
</span>

<style>
  .tooltip {
    animation:
      fade-in 100ms ease-out,
      scale-in 100ms ease-out;
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
