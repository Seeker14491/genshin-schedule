<script lang="ts">
  import { KeyIcon, LogInIcon, UserIcon, UserXIcon } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  import { AnonymousToken } from "#lib/utils/api.ts";
  import { createApiClient, setAuthToken } from "#lib/utils/auth.ts";
  import { m } from "#lib/paraglide/messages.js";
  import Alert from "../ui/Alert.svelte";
  import Button from "../ui/Button.svelte";
  import Tooltip from "../ui/Tooltip.svelte";
  import { subtleInputClass } from "../ui/input.ts";

  let username = $state("");
  let password = $state("");
  let loading = $state(false);
  let error = $state<Error>();
</script>

<!-- signs in, or creates an account if the username doesn't exist yet -->
<form
  class="flex flex-col gap-4"
  onsubmit={async (e) => {
    e.preventDefault();
    loading = true;

    try {
      const { token } = await createApiClient().auth({ username, password });

      setAuthToken(token);
      await goto("/home");
    } catch (e) {
      error = e as Error;
      loading = false;
    }
  }}
>
  {#if error}
    <Alert status="error">
      {#snippet title()}{m.error()}{/snippet}
      {error.message}
    </Alert>
  {/if}

  <div class="flex flex-col gap-2">
    <div class="relative flex items-center">
      <div class="pointer-events-none absolute inset-y-0 start-0 flex items-center px-3 text-sm text-fg-muted">
        <UserIcon size="1em" />
      </div>
      <input
        class="{subtleInputClass} ps-10"
        placeholder={m.username()}
        aria-label={m.username()}
        autocomplete="username"
        bind:value={username}
      />
    </div>

    <div class="relative flex items-center">
      <div class="pointer-events-none absolute inset-y-0 start-0 flex items-center px-3 text-sm text-fg-muted">
        <KeyIcon size="1em" />
      </div>
      <input
        type="password"
        class="{subtleInputClass} ps-10"
        placeholder={m.password()}
        aria-label={m.password()}
        autocomplete="current-password"
        bind:value={password}
        oninput={() => {
          if (!password) error = undefined;
        }}
      />
    </div>
  </div>

  <p class="text-sm text-gray-500">{m.password_reuse_warning()}</p>

  <div class="flex flex-wrap gap-2">
    <Button type="submit" variant="solid" palette="blue" {loading} disabled={!username || !password}>
      <LogInIcon />
      {m.submit()}
    </Button>

    <Tooltip content={m.continue_without_signing_in_hint()} closeOnClick={false}>
      <Button
        disabled={loading}
        onclick={() => {
          setAuthToken(AnonymousToken);
          goto("/home");
        }}
      >
        <UserXIcon />
        {m.continue_without_signing_in()}
      </Button>
    </Tooltip>
  </div>
</form>
