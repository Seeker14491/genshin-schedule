<script lang="ts">
  import { untrack } from "svelte";
  import { DateTime } from "luxon";
  import { ResinCap, ResinPerMinute } from "#lib/db/resin.ts";
  import { syncNotification } from "#lib/utils/notifications.svelte.ts";
  import { config } from "#lib/session.svelte.ts";
  import { clock } from "#lib/clock.svelte.ts";
  import { m } from "#lib/paraglide/messages.js";

  // color of the Discord message embed
  const NotificationColor = "#63b3ed";

  /** Time at which resin reaches the notification threshold. */
  const capTime = $derived(
    DateTime.fromMillis(config.resin.time)
      .plus({ minutes: (config.resinNotifyMark - config.resin.value) / ResinPerMinute })
      .valueOf(),
  );

  // only resin recharging up to the threshold sends a notification, not adding resin (or setting it) to reach it
  const enabled = $derived(config.resin.value < config.resinNotifyMark && clock.minute < capTime);

  // the message is a new object only when the time or threshold changes, which is when the server is updated
  const notification = $derived.by(() => {
    const [time, mark] = [capTime, config.resinNotifyMark];

    return untrack(() => ({
      key: "resin",
      time,
      // a fixed address, so that the icon of notifications queued before a deploy still works
      icon: "/resin.webp",
      title: m.notification_title(),
      description: mark === ResinCap ? m.notification_full() : m.notification_value({ value: mark }),
      url: "/home",
      color: NotificationColor,
    }));
  });

  syncNotification("resin", () => (enabled ? notification : null));
</script>
