<script lang="ts">
  import { LogOutIcon } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  import { setAuthToken } from "#lib/utils/auth.ts";
  import { m } from "#lib/paraglide/messages.js";
  import Button from "../ui/Button.svelte";
</script>

<Button
  onclick={() => {
    setAuthToken(undefined);
    goto("/");
  }}
>
  <LogOutIcon />
  {m.sign_out()}
</Button>
