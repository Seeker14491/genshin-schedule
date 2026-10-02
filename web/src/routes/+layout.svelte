<script lang="ts">
  import "../app.css";
  import { onMount, type Snippet } from "svelte";
  import { dev } from "$app/env";
  import { config } from "#lib/session.svelte.ts";
  import { locale } from "#lib/i18n.svelte.ts";
  import { applyTheme } from "#lib/theme.ts";
  import LoadingBar from "#lib/components/ui/LoadingBar.svelte";
  import Toaster from "#lib/components/ui/Toaster.svelte";

  let { children }: { children: Snippet } = $props();

  $effect(() => applyTheme(config.theme));

  $effect(() => {
    document.documentElement.lang = locale.current;
  });

  onMount(() => {
    // the app has loaded, including the user's data
    document.getElementById("boot-progress")?.remove();

    // makes the site installable as an app on older browsers
    navigator.serviceWorker?.register("/sw.js").catch(() => {});

    if (!dev) {
      const script = document.createElement("script");
      script.src = "https://bing.seekr.pw/chilling.js";
      script.dataset.websiteId = "c976809c-8201-40e1-bed0-238345a7635f";
      script.defer = true;
      document.head.append(script);
    }
  });
</script>

<LoadingBar />
<Toaster />
{@render children()}
