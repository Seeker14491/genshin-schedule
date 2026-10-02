<script lang="ts">
  import { CheckIcon, CodeIcon, CopyIcon, PencilIcon } from "@lucide/svelte";
  import { getDefaultConfig, validateConfigData } from "#lib/utils/config.ts";
  import { store } from "#lib/session.svelte.ts";
  import { m } from "#lib/paraglide/messages.js";
  import Alert from "../ui/Alert.svelte";
  import Button from "../ui/Button.svelte";
  import Dialog from "../ui/Dialog.svelte";
  import { toaster } from "../ui/toaster.svelte";
  import { textareaClass } from "../ui/input.ts";

  let open = $state(false);
  let data = $state("");
  let copied = $state(false);
  let copiedTimeout: ReturnType<typeof setTimeout>;

  function overwrite() {
    const result = validateConfigData(data);

    if (!result.valid) {
      const description =
        result.reason === "json"
          ? m.data_invalid_json()
          : result.reason === "object"
            ? m.data_invalid_object()
            : m.data_invalid_value({ key: result.key });

      toaster.error(m.error(), description);
      return;
    }

    store.set({ ...getDefaultConfig(Date.now()), ...result.data });
    open = false;
  }

  async function copy() {
    await navigator.clipboard.writeText(data);

    copied = true;
    clearTimeout(copiedTimeout);
    copiedTimeout = setTimeout(() => (copied = false), 3000);
  }
</script>

<Button
  onclick={() => {
    // show the latest data every time the dialog is opened
    data = JSON.stringify(store.get(), null, 2);
    open = true;
  }}
>
  <CodeIcon />
  {m.manage_data()}
</Button>

<!-- shows the config as JSON for backup, and allows overwriting it -->
<Dialog bind:open>
  {#snippet title()}{m.manage_data()}{/snippet}

  <div class="flex flex-col gap-4">
    <Alert status="warning">
      {#snippet title()}{m.manage_data_warning()}{/snippet}
    </Alert>

    <div>
      {m.manage_data_description()}
      <strong>{m.cannot_be_undone()}</strong>
    </div>

    <textarea
      class="{textareaClass} h-[32rem] font-mono text-sm"
      aria-label={m.manage_data()}
      spellcheck="false"
      bind:value={data}></textarea>
  </div>

  {#snippet footer()}
    <Button variant="solid" palette="red" onclick={overwrite}>
      <PencilIcon />
      {m.overwrite()}
    </Button>

    <Button onclick={copy}>
      {#if copied}<CheckIcon />{m.copied()}{:else}<CopyIcon />{m.copy()}{/if}
    </Button>
  {/snippet}
</Dialog>
