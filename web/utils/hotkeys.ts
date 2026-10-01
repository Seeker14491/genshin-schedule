import { useEffect, useRef } from "react";

/**
 * Calls `handler` when a key matching `match` is pressed, unless the user is typing in a form field
 * or holding Ctrl/Alt/Meta.
 */
export function useHotkey(match: (e: KeyboardEvent) => boolean, handler: () => void, enabled = true) {
  const callbacks = useRef({ match, handler });

  useEffect(() => {
    callbacks.current = { match, handler };
  });

  useEffect(() => {
    if (!enabled) return;

    const listener = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.repeat || isEditable(e.target)) return;

      if (callbacks.current.match(e)) {
        e.preventDefault();
        callbacks.current.handler();
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [enabled]);
}

function isEditable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}
