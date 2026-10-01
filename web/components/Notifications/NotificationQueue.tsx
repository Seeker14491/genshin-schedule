"use client";

import { useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { Box, Button, chakra, Code, HStack, Stack } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { SendIcon } from "lucide-react";
import { DateTime } from "luxon";
import type { Notification } from "@/utils/api";
import { createApiClient } from "@/utils/auth";
import { formatDuration, useNow } from "@/utils/time";
import Panel from "../Panel";
import { toaster } from "../ui/toaster";

/** Lists the user's queued Discord notifications. */
const NotificationQueue = ({ queue }: { queue: Notification[] }) => {
  return (
    <Stack gap={4}>
      <div>
        <FormattedMessage defaultMessage="Notification queue" />:
      </div>

      {queue.length ? (
        [...queue]
          .sort((a, b) => a.time - b.time)
          .map((notification) => <Item key={notification.key} notification={notification} />)
      ) : (
        <div>
          <FormattedMessage defaultMessage="There are no notifications in queue." />
        </div>
      )}
    </Stack>
  );
};

const Item = ({ notification }: { notification: Notification }) => {
  const intl = useIntl();
  const router = useRouter();
  const [action, setAction] = useState<"send" | "dequeue">();
  const now = useNow(1000);

  const time = DateTime.fromMillis(notification.time);

  const run = async (type: "send" | "dequeue", callback: () => Promise<void>) => {
    setAction(type);

    try {
      await callback();
      router.refresh();
    } catch (e) {
      toaster.create({ type: "error", title: "Error", description: (e as Error).message, closable: true });
    } finally {
      setAction(undefined);
    }
  };

  return (
    <Panel divide>
      <HStack gap={2}>
        <chakra.img src={notification.icon} alt="" w={10} h={10} />
        <Stack gap={0}>
          <Box fontSize="lg">{notification.title}</Box>

          {notification.description && (
            <Box fontSize="sm" color="gray.500">
              {notification.description}
            </Box>
          )}
        </Stack>
      </HStack>

      <Stack gap={4} align="start">
        <div>
          <FormattedMessage
            defaultMessage="Scheduled at {time} in {duration}."
            values={{
              // shown in the browser's time zone, which the server doesn't know
              time: <Code suppressHydrationWarning>{time.toSQL()}</Code>,
              duration: <Code>{formatDuration(intl, time.diff(DateTime.fromMillis(now)))}</Code>,
            }}
          />
        </div>

        <HStack gap={2}>
          <Button
            size="sm"
            colorPalette="blue"
            loading={action === "send"}
            disabled={!!action}
            onClick={() =>
              run("send", () => createApiClient().setNotification({ ...notification, time: DateTime.utc().valueOf() }))
            }
          >
            <SendIcon />
            <FormattedMessage defaultMessage="Send now" />
          </Button>

          <Button
            size="sm"
            variant="subtle"
            loading={action === "dequeue"}
            disabled={!!action}
            onClick={() => run("dequeue", () => createApiClient().deleteNotification(notification.key))}
          >
            <FormattedMessage defaultMessage="Dequeue" />
          </Button>
        </HStack>
      </Stack>
    </Panel>
  );
};

export default NotificationQueue;
