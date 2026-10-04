<script lang="ts">
  import { CommandIcon } from "@lucide/svelte";
  import { onHotkey } from "#lib/utils/hotkeys.svelte.ts";
  import { splitMessage } from "#lib/utils/message.ts";
  import { m } from "#lib/paraglide/messages.js";
  import Dialog from "./ui/Dialog.svelte";
  import Kbd from "./ui/Kbd.svelte";

  let { open = $bindable() }: { open: boolean } = $props();

  onHotkey(
    (e) => e.key === "k",
    () => (open = true),
  );
</script>

<Dialog bind:open>
  {#snippet title()}
    <span class="flex items-center gap-2">
      <CommandIcon size="1em" />
      {m.keyboard_shortcuts()}
    </span>
  {/snippet}

  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <h3 class="font-heading text-style-md font-semibold">{m.resin_calculator()}</h3>

      <ul class="flex list-disc flex-col ps-4 marker:text-fg-subtle">
        {#each [{ format: m.shortcuts_subtract, key: "2" }, { format: m.shortcuts_add, key: "shift+2" }] as { format, key } (key)}
          <li>
            {#each splitMessage((values) => format({ amount: 20, ...values }), ["key"]) as part, i (i)}
              {#if "text" in part}{part.text}{:else}<Kbd>{key}</Kbd>{/if}
            {/each}
          </li>
        {/each}
      </ul>
    </div>

    <div class="flex flex-col gap-2">
      <h3 class="font-heading text-style-md font-semibold">{m.shortcuts_other()}</h3>

      <ul class="flex list-disc flex-col ps-4 marker:text-fg-subtle">
        <li>
          <span class="inline-flex items-baseline gap-2">{m.shortcuts_show()} <Kbd>k</Kbd></span>
        </li>
      </ul>
    </div>
  </div>
</Dialog>
