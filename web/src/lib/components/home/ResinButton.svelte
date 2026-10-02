<script lang="ts">
  import { onHotkey } from "#lib/utils/hotkeys.svelte.ts";
  import { m } from "#lib/paraglide/messages.js";
  import Button from "../ui/Button.svelte";

  let { delta, onclick }: { delta: number; onclick: () => void } = $props();

  // two-digit multiples of ten get a shortcut: the first digit subtracts, shift + the first digit adds.
  // event.code is used because shift changes event.key (e.g. shift+2 is "@" on US keyboards)
  const digit = $derived(Math.abs(delta) < 100 && delta % 10 === 0 ? Math.abs(delta).toString()[0] : undefined);

  onHotkey(
    (e) => (e.code === `Digit${digit}` || e.code === `Numpad${digit}`) && e.shiftKey === delta > 0,
    () => onclick(),
    () => digit !== undefined,
  );
</script>

<Button
  size="compact"
  palette="muted"
  title={delta > 0 ? m.add_resins({ amount: delta }) : m.subtract_resins({ amount: Math.abs(delta) })}
  {onclick}
>
  {delta > 0 ? `+${delta}` : `${delta}`}
</Button>
