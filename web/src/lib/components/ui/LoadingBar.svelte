<script lang="ts">
  import { navigating } from "$app/state";
</script>

<!-- thin bar at the top of the page while a page is loading, like the one in app.html while the app starts -->
{#if navigating.type}
  <div class="pointer-events-none fixed inset-x-0 top-0 z-[1600] h-0.5 overflow-hidden" role="progressbar">
    <div class="h-full w-2/5 animate-progress bg-blue-300 dark:bg-white"></div>
  </div>
{/if}
