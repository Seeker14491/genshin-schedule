<script lang="ts">
  import { BellIcon, CheckIcon, CopyIcon, LinkIcon } from "@lucide/svelte";
  import { isAuthenticated } from "#lib/utils/api.ts";
  import { getAuthToken } from "#lib/utils/auth.ts";
  import { splitMessage } from "#lib/utils/message.ts";
  import { m } from "#lib/paraglide/messages.js";
  import Bot from "#lib/assets/notifications/Bot.webp";
  import Privacy from "#lib/assets/notifications/Privacy.webp";
  import PrivacyDM from "#lib/assets/notifications/PrivacyDM.webp";
  import Success from "#lib/assets/notifications/Success.webp";
  import Panel from "../Panel.svelte";
  import Button from "../ui/Button.svelte";
  import { inputClass } from "../ui/input.ts";

  const DiscordBotInvite =
    "https://discord.com/oauth2/authorize?client_id=786827003164098610&scope=bot&permissions=379968";

  // the message to send to the bot, which contains the user's auth token
  const token = getAuthToken();
  const message = $derived(isAuthenticated(token) ? `enable ||${token}||` : m.not_signed_in());

  let copied = $state(false);
  let copiedTimeout: ReturnType<typeof setTimeout>;

  async function copy() {
    await navigator.clipboard.writeText(message);

    copied = true;
    clearTimeout(copiedTimeout);
    copiedTimeout = setTimeout(() => (copied = false), 3000);
  }
</script>

{#snippet screenshot(src: string)}
  <div class="w-max max-w-full">
    <img {src} alt="" class="w-2/5 max-w-full min-w-xs rounded-md" />
  </div>
{/snippet}

<!-- explains how to set up Discord notifications -->
<Panel divide>
  <div class="flex items-center gap-2 text-xl font-bold">
    <BellIcon size="1em" />
    <h1>{m.notifications()}</h1>
  </div>

  <div class="flex flex-col items-start gap-4">
    <div>
      {#each splitMessage(m.notifications_intro, ["settings"]) as part, i (i)}
        {#if "text" in part}{part.text}{:else}<a href="/settings" class="link [--link-color:var(--color-link-blue)]"
            >{m.settings()}</a
          >{/if}
      {/each}
    </div>

    {@render screenshot(Bot)}

    <div class="flex w-full flex-col items-start gap-2">
      {m.notifications_step_invite()}

      <Button palette="discord" href={DiscordBotInvite} target="_blank" rel="noopener noreferrer">
        <LinkIcon />
        {m.invite_bot()}
      </Button>
    </div>

    <div class="flex w-full flex-col items-start gap-2">
      {m.notifications_step_privacy()}
      {@render screenshot(Privacy)}
      {@render screenshot(PrivacyDM)}
    </div>

    <div class="flex w-full flex-col items-start gap-2">
      {m.notifications_step_message()}

      <div class="flex w-full">
        <div class="-me-px flex items-center rounded-s-sm border border-border bg-bg-muted px-1 text-style-sm">
          <Button variant="ghost" size="sm" onclick={copy}>
            {#if copied}<CheckIcon />{m.copied()}{:else}<CopyIcon />{m.copy()}{/if}
          </Button>
        </div>

        <input class="{inputClass} rounded-s-none" readonly value={message} aria-label={m.notifications_message()} />
      </div>
    </div>

    <div class="flex w-full flex-col items-start gap-2">
      {m.notifications_step_success()}
      {@render screenshot(Success)}
    </div>
  </div>
</Panel>
