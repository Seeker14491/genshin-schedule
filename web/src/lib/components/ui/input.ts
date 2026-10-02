const base =
  "h-10 w-full min-w-0 appearance-none rounded-sm border px-3 text-start text-style-sm outline-0 focus-visible:border-gray-focus-ring focus-visible:outline-1 focus-visible:outline-gray-focus-ring disabled:cursor-not-allowed disabled:opacity-50";

/** Classes for text inputs with a border. */
export const inputClass = `${base} border-border bg-transparent`;

/** Classes for text inputs with a gray background instead of a border. */
export const subtleInputClass = `${base} border-transparent bg-bg-muted`;

/** Classes for multi-line text inputs with a border. */
export const textareaClass =
  "w-full min-w-0 appearance-none rounded-sm border border-border bg-transparent px-3 py-2 text-start text-style-sm outline-0 focus-visible:border-gray-focus-ring focus-visible:outline-1 focus-visible:outline-gray-focus-ring";
