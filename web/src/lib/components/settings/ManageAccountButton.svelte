<script lang="ts">
  import { UploadIcon, UserIcon } from "@lucide/svelte";
  import { refreshAll } from "$app/navigation";
  import type { User } from "#lib/utils/api.ts";
  import { createApiClient } from "#lib/utils/auth.ts";
  import { replaceAuthToken } from "#lib/session.svelte.ts";
  import { m } from "#lib/paraglide/messages.js";
  import Button from "../ui/Button.svelte";
  import Dialog from "../ui/Dialog.svelte";
  import { toaster } from "../ui/toaster.svelte";
  import { inputClass } from "../ui/input.ts";

  let { user }: { user: User } = $props();

  let open = $state(false);
  let loading = $state(false);
  // svelte-ignore state_referenced_locally
  let username = $state(user.username);
  let password = $state("");
</script>

<Button onclick={() => (open = true)}>
  <UserIcon />
  {m.manage_account()}
</Button>

<!-- changes the signed-in user's username and password -->
<Dialog
  bind:open
  onsubmit={async (e) => {
    e.preventDefault();
    loading = true;

    try {
      const { token } = await createApiClient().updateAuth({ username, password });

      replaceAuthToken(token);
      open = false;
      await refreshAll();
    } catch (e) {
      toaster.error(m.error(), (e as Error).message);
    } finally {
      loading = false;
    }
  }}
>
  {#snippet title()}{m.manage_account()}{/snippet}

  <div class="flex flex-col gap-4">
    <div>{m.manage_account_description()}</div>

    <div class="flex w-full flex-col items-start gap-1.5">
      <label for="account-username" class="flex items-center gap-1 text-style-sm font-medium">
        {m.username()}
        <span class="text-fg-error" aria-hidden="true">*</span>
      </label>
      <input
        id="account-username"
        class={inputClass}
        placeholder={m.new_username()}
        autocomplete="username"
        required
        bind:value={username}
      />
    </div>

    <div class="flex w-full flex-col items-start gap-1.5">
      <label for="account-password" class="flex items-center gap-1 text-style-sm font-medium">
        {m.password()}
        <span class="text-fg-error" aria-hidden="true">*</span>
      </label>
      <input
        id="account-password"
        type="password"
        class={inputClass}
        placeholder={m.new_password()}
        autocomplete="new-password"
        required
        bind:value={password}
      />
    </div>

    <div>
      {m.linked_discord_id()}:
      <code
        class="inline-flex min-h-5 items-center rounded-sm bg-gray-subtle px-1.5 font-mono text-style-xs text-gray-fg"
        >{user.discordUserId ?? "<null>"}</code
      >
    </div>
  </div>

  {#snippet footer()}
    <Button type="submit" variant="solid" palette="red" {loading}>
      <UploadIcon />
      {m.submit()}
    </Button>

    <Button onclick={() => (open = false)}>{m.cancel()}</Button>
  {/snippet}
</Dialog>
