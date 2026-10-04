<script lang="ts">
  import { formatResinButton } from "#lib/db/resin.ts";
  import { m } from "#lib/paraglide/messages.js";
  import Button from "../ui/Button.svelte";

  let { delta, onclick }: { delta: number; onclick: () => void } = $props();
</script>

<Button
  size="compact"
  palette="muted"
  title={delta > 0 ? m.add_resin({ amount: delta }) : m.subtract_resin({ amount: Math.abs(delta) })}
  {onclick}
>
  {formatResinButton(delta)}
</Button>
