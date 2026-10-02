<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  let {
    value,
    onvalue,
    class: className = "",
    ...rest
  }: {
    value: number;
    /** called with the entered number (NaN if the input is empty) */
    onvalue: (value: number) => void;
  } & Omit<HTMLInputAttributes, "value"> = $props();

  let focus = $state(false);
</script>

<!--
  borderless number input that is only as wide as its value. Selects its contents when clicked.
  Digits are all 1ch wide with tabular numbers, so the width fits the value exactly
-->
<input
  type="number"
  class={[
    "auto-size rounded-sm bg-inherit text-center tabular-nums outline-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-focus-ring",
    !focus && "cursor-pointer",
    className,
  ]}
  style:width="calc({value.toString().length}ch + {focus ? 8 : 0}px)"
  value={value.toString()}
  onfocus={() => (focus = true)}
  onblur={() => (focus = false)}
  onclick={(e) => e.currentTarget.select()}
  oninput={(e) => {
    const input = e.currentTarget;
    onvalue(input.valueAsNumber);

    // like a controlled input, always show the resulting value (e.g. clamped to a maximum)
    queueMicrotask(() => {
      if (input.value !== value.toString()) input.value = value.toString();
    });
  }}
  {...rest}
/>

<style>
  .auto-size {
    appearance: textfield;
  }

  .auto-size::-webkit-inner-spin-button,
  .auto-size::-webkit-outer-spin-button {
    appearance: none;
    margin: 0;
  }
</style>
