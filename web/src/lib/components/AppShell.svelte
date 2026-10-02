<script lang="ts">
  import type { Snippet } from "svelte";
  import Header from "./Header.svelte";
  import Footer from "./Footer.svelte";
  import Background from "./Background.svelte";
  import ShortcutHelp from "./ShortcutHelp.svelte";

  let { header = true, children }: { header?: boolean; children: Snippet } = $props();

  let shortcuts = $state(false);
</script>

<!-- page layout with header, footer and background -->
<ShortcutHelp bind:open={shortcuts} />
<Background />

<div class="mx-auto flex min-h-screen max-w-[1200px] flex-col">
  {#if header}
    <Header />
  {/if}

  <main class="flex flex-col p-4">
    {@render children()}
  </main>

  <div class="flex-1"></div>

  <Footer showShortcuts={() => (shortcuts = true)} />
</div>
