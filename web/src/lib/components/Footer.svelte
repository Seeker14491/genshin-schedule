<script lang="ts">
  import { CommandIcon } from "@lucide/svelte";
  import { splitMessage } from "#lib/utils/message.ts";
  import { m } from "#lib/paraglide/messages.js";
  import Tooltip from "./ui/Tooltip.svelte";
  import GitHubIcon from "./ui/GitHubIcon.svelte";

  let { showShortcuts }: { showShortcuts: () => void } = $props();

  const RepositoryUrl = "https://github.com/Seeker14491/genshin-schedule";

  const links = $derived({
    seekr: { href: "https://github.com/Seeker14491", text: "Seekr" },
    chiya: { href: "https://github.com/chiyadev", text: "chiya.dev" },
    contributors: { href: "https://github.com/chiyadev/genshin-schedule/graphs/contributors", text: m.contributors() },
  });
</script>

<footer class="flex flex-col gap-4 p-4 text-center text-gray-500">
  <p class="text-sm">{m.disclaimer()}</p>

  <p class="text-sm [--link-color:var(--color-link-pink)]">
    {#each splitMessage(m.credits, ["seekr", "chiya", "contributors"]) as part, i (i)}
      {#if "text" in part}
        {part.text}
      {:else}
        <a class="link" href={links[part.placeholder].href} target="_blank" rel="noopener noreferrer">
          {links[part.placeholder].text}
        </a>
      {/if}
    {/each}
  </p>

  <div class="flex items-center justify-center gap-4">
    <Tooltip content={m.shortcuts()}>
      <button type="button" class="link" aria-label={m.shortcuts()} onclick={showShortcuts}>
        <CommandIcon size="1em" />
      </button>
    </Tooltip>

    <Tooltip content="GitHub">
      <a class="link" href={RepositoryUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
        <GitHubIcon />
      </a>
    </Tooltip>
  </div>
</footer>
