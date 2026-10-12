import { untrack } from "svelte";
import type { Notification } from "./api";
import { createApiClient } from "./auth";
import { getSessionToken, sessionState } from "#lib/session.svelte.ts";

// pending updates per account and notification key; kept outside components so navigating away doesn't cancel them
const pending: Record<string, ReturnType<typeof setTimeout>> = {};

function scheduleUpdate(key: string, notification: Notification | null) {
  // the notification goes to the account whose data it was made from, even if another tab signs in to another account
  const token = getSessionToken();
  const id = `${token} ${key}`;

  clearTimeout(pending[id]);

  pending[id] = setTimeout(async () => {
    delete pending[id];

    try {
      const client = createApiClient(undefined, token);

      if (notification) {
        await client.setNotification({
          ...notification,
          url: new URL(notification.url, window.location.href).href,
          icon: new URL(notification.icon, window.location.href).href,
        });
      } else {
        await client.deleteNotification(key);
      }
    } catch (e) {
      console.error(e);
    }
  }, 1000);
}

/**
 * Queues the notification returned by `get` on the server for delivery via Discord, or removes it when `get` returns
 * null. The server is only updated when the result of `get` changes (a different object), not when the component is
 * created. Does nothing for users who aren't signed in. Must be called while a component is being created.
 */
export function syncNotification(key: string, get: () => Notification | null) {
  const desired = $derived.by(get);
  // the notification when the component is created, which the server is assumed to have already
  let last = untrack(() => desired);

  $effect(() => {
    if (sessionState.synchronized && last !== desired) {
      last = desired;
      scheduleUpdate(key, desired);
    }
  });
}
