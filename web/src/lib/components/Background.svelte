<script lang="ts">
  import { config } from "#lib/session.svelte.ts";
  import { BackgroundImages } from "#lib/assets/index.ts";
</script>

<!-- faint character art in the bottom right corner of the page -->
{#if config.background !== "none" && BackgroundImages[config.background]}
  <img
    alt=""
    src={BackgroundImages[config.background]}
    class="pointer-events-none fixed top-0 right-0 -z-10 h-full w-full max-w-xl object-contain object-[100%_100%] opacity-[0.08] select-none"
  />
{/if}
