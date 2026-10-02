<script lang="ts" module>
  export type ButtonProps = {
    /** solid: filled with the palette color. subtle: light background. ghost: no background until hovered */
    variant?: "solid" | "subtle" | "ghost";
    /** muted is gray with lighter text */
    palette?: "gray" | "muted" | "blue" | "red" | "discord";
    /** compact is sm with less padding; icon is a square sm button for a single icon */
    size?: "md" | "sm" | "compact" | "icon";
    /** shows a spinner instead of the contents and disables the button */
    loading?: boolean;
    /** renders a link styled as a button */
    href?: string;
    class?: string;
    children?: Snippet;
  } & Omit<HTMLButtonAttributes, "class"> &
    Omit<HTMLAnchorAttributes, "class">;
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";

  let {
    variant = "subtle",
    palette = "gray",
    size = "md",
    loading = false,
    href,
    class: className = "",
    disabled,
    children,
    ...rest
  }: ButtonProps = $props();

  const sizes = {
    md: "h-10 min-w-10 gap-2 px-4 [&_svg]:size-5",
    sm: "h-9 min-w-9 gap-2 px-3.5 [&_svg]:size-4",
    compact: "h-9 min-w-9 gap-2 px-2 [&_svg]:size-4",
    icon: "size-9 [&_svg]:size-4",
  };

  const colors = {
    solid: {
      gray: "bg-gray-900 text-white hover:bg-gray-900/90",
      muted: "bg-gray-900 text-white hover:bg-gray-900/90",
      blue: "bg-blue-solid text-white hover:bg-blue-solid/90 [--focus-ring-color:var(--color-blue-focus-ring)]",
      red: "bg-red-solid text-white hover:bg-red-solid/90 [--focus-ring-color:var(--color-red-600)]",
      discord: "bg-discord text-white hover:bg-discord-hover",
    },
    subtle: {
      gray: "bg-gray-subtle text-gray-fg hover:bg-gray-muted",
      muted: "bg-gray-subtle text-gray-500 hover:bg-gray-muted",
      blue: "bg-gray-subtle text-gray-fg hover:bg-gray-muted",
      red: "bg-gray-subtle text-gray-fg hover:bg-gray-muted",
      discord: "bg-discord text-white hover:bg-discord-hover",
    },
    ghost: {
      gray: "text-gray-fg hover:bg-gray-subtle",
      muted: "text-gray-500 hover:bg-gray-subtle",
      blue: "text-gray-fg hover:bg-gray-subtle",
      red: "text-gray-fg hover:bg-gray-subtle",
      discord: "text-gray-fg hover:bg-gray-subtle",
    },
  };

  const classes = $derived(
    [
      "focus-ring relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm border border-transparent align-middle text-style-sm font-medium whitespace-nowrap select-none transition-colors duration-200 outline-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 [&_svg]:shrink-0",
      sizes[size],
      colors[variant][palette],
      className,
    ].join(" "),
  );
</script>

{#snippet content()}
  {#if loading}
    <span class="absolute inset-0 flex items-center justify-center">
      <span
        class="size-[1em] animate-spin rounded-full border-2 border-current border-s-transparent border-b-transparent"
      ></span>
    </span>
    <span class="invisible flex items-center gap-2">{@render children?.()}</span>
  {:else}
    {@render children?.()}
  {/if}
{/snippet}

{#if href}
  <a {href} class={classes} {...rest}>{@render content()}</a>
{:else}
  <button
    type="button"
    class={classes}
    disabled={disabled || loading}
    aria-disabled={disabled || loading ? "true" : undefined}
    {...rest}
  >
    {@render content()}
  </button>
{/if}
