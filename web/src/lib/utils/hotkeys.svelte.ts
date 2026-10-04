/**
 * Calls `handler` when a key matching `match` is pressed, while `enabled` returns true.
 * Keys are ignored while the user is typing in a form field or holding Ctrl/Alt/Meta.
 * Must be called while a component is being created.
 */
export function onHotkey(
  match: (e: KeyboardEvent) => boolean,
  handler: (e: KeyboardEvent) => void,
  enabled = () => true,
) {
  $effect(() => {
    if (!enabled()) return;

    const listener = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.repeat || isEditable(e.target)) return;

      if (match(e)) {
        e.preventDefault();
        handler(e);
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });
}

function isEditable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/**
 * The digit 1-9 of a key on the number row, or on the number pad while it types digits, whether shift is held or not.
 * event.code is used for the number row, because shift changes event.key (e.g. shift+2 is "@" on US keyboards).
 */
export function getDigit(e: KeyboardEvent) {
  const match = /^(Digit|Numpad)([1-9])$/.exec(e.code);

  // number pad keys are arrows instead of digits while num lock is off, and with shift on Windows
  if (match && (match[1] === "Digit" || e.key === match[2])) {
    return Number(match[2]);
  }
}
