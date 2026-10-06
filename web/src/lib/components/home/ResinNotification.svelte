<script lang="ts">
  import { untrack } from "svelte";
  import { getResinTime, ResinCap } from "#lib/db/resin.ts";
  import { syncNotification } from "#lib/utils/notifications.svelte.ts";
  import { config } from "#lib/session.svelte.ts";
  import { m } from "#lib/paraglide/messages.js";

  // color of the Discord message embed
  const NotificationColor = "#63b3ed";

  /** Time at which resin reaches the notification threshold. */
  const capTime = $derived(getResinTime(config.resin, config.resinNotifyMark));

  // the message is a new object only when the time or threshold changes, which is when the server is updated.
  // A time that has already passed by then removes the notification: only resin recharging up to the threshold sends
  // one, not adding resin (or setting it) to reach it, or lowering the threshold below it. Reaching the time later
  // changes nothing, since the server sends it then, and removing it could stop it from being sent
  const notification = $derived.by(() => {
    const [time, mark] = [capTime, config.resinNotifyMark];

    if (time <= Date.now()) {
      return null;
    }

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

  syncNotification("resin", () => notification);
</script>
