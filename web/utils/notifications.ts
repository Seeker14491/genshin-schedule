import { useContext, useEffect, useRef } from "react";
import type { Notification } from "./api";
import { createApiClient } from "./auth";
import { ConfigContext } from "./config";

// pending updates per notification key; kept outside components so navigating away doesn't cancel them
const pending = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleUpdate(key: string, notification: Notification | null) {
  clearTimeout(pending.get(key));

  pending.set(
    key,
    setTimeout(async () => {
      pending.delete(key);

      try {
        const client = createApiClient();

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
    }, 1000),
  );
}

/**
 * Queues `notification` on the server for delivery via Discord while `enabled` is true, and removes it otherwise.
 * The server is only updated when the notification changes, not when the component mounts.
 * Does nothing for users who aren't signed in.
 */
export function useApiNotification(notification: Notification, enabled: boolean) {
  const { synchronized } = useContext(ConfigContext);
  const desired = enabled ? notification : null;
  const last = useRef(desired);

  useEffect(() => {
    if (synchronized && last.current !== desired) {
      last.current = desired;
      scheduleUpdate(notification.key, desired);
    }
  }, [synchronized, desired, notification.key]);
}
