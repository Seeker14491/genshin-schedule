const Marker = "\u0000";

export type MessagePart<K extends string> = { text: string } | { placeholder: K };

/**
 * Splits a translated message into text and placeholders, so that placeholders can be rendered as e.g. links.
 * `format` is a message function such as `m.credits`, and `placeholders` are the names of its parameters
 * that should be returned as placeholders rather than text.
 */
export function splitMessage<K extends string>(
  format: (values: Record<K, string>) => string,
  placeholders: readonly K[],
): MessagePart<K>[] {
  const values = Object.fromEntries(placeholders.map((key) => [key, `${Marker}${key}${Marker}`])) as Record<K, string>;

  return format(values)
    .split(Marker)
    .map((part, i) => (i % 2 ? { placeholder: part as K } : { text: part }))
    .filter((part) => !("text" in part) || part.text);
}
