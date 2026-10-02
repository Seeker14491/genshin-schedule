/**
 * Calls `handler` when a key matching `match` is pressed, while `enabled` returns true.
 * Keys are ignored while the user is typing in a form field or holding Ctrl/Alt/Meta.
 * Must be called while a component is being created.
 */
export function onHotkey(match: (e: KeyboardEvent) => boolean, handler: () => void, enabled = () => true) {
  $effect(() => {
    if (!enabled()) return;

    const listener = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.repeat || isEditable(e.target)) return;

      if (match(e)) {
        e.preventDefault();
        handler();
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
