<script lang="ts">
  import { page } from "$app/state";
  import { RotateCwIcon } from "@lucide/svelte";
  import { m } from "#lib/paraglide/messages.js";
  import Button from "#lib/components/ui/Button.svelte";
</script>

<!-- shown for unknown pages, and when the user's data couldn't be loaded -->
<div class="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
  {#if page.status === 404}
    <h1 class="font-heading text-style-2xl font-semibold">{m.page_not_found()}</h1>
    <Button href="/">{m.go_home()}</Button>
  {:else}
    <h1 class="font-heading text-style-2xl font-semibold">{m.load_error_title()}</h1>
    <p class="text-gray-500">{m.load_error_description()}</p>
    <Button onclick={() => location.reload()}>
      <RotateCwIcon />
      {m.retry()}
    </Button>
  {/if}
</div>
