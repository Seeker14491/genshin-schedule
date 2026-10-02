<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    value = $bindable(),
    min,
    max,
    step,
    label,
  }: { value: number; min: number; max: number; step: number; label: Snippet } = $props();

  const id = $props.id();
  const percent = $derived((Math.min(Math.max(value, min), max) - min) / (max - min));
</script>

<!--
  a native range input, made invisible, handles keyboard and pointer input on top of the drawn track and thumb.
  Its thumb is the same size as the drawn one, so that both are at the same position
-->
<div class="flex w-sm max-w-full flex-col gap-1 text-style-sm">
  <div class="flex justify-between gap-2">
    <label for={id} class="font-medium">{@render label()}</label>
    <span>{value}</span>
  </div>

  <div class="relative flex h-5 items-center">
    <div class="h-2 w-full rounded-full bg-bg-emphasized/72 shadow-inset">
      <div class="h-full rounded-full bg-blue-solid" style:width="calc({percent} * (100% - 20px) + 10px)"></div>
    </div>

    <div
      class="thumb pointer-events-none absolute top-0 size-5 rounded-full border-2 border-blue-solid bg-bg"
      style:left="calc({percent} * (100% - 20px))"
    ></div>

    <input
      {id}
      type="range"
      class="range absolute inset-0 m-0 h-full w-full cursor-pointer appearance-none opacity-0"
      {min}
      {max}
      {step}
      bind:value
    />
  </div>
</div>

<style>
  .range::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
  }

  .range::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border: 0;
  }

  /* the drawn thumb shows the focus outline of the invisible input */
  div:has(> .range:focus-visible) > .thumb {
    outline: 2px solid var(--color-blue-focus-ring);
    outline-offset: 2px;
  }
</style>
