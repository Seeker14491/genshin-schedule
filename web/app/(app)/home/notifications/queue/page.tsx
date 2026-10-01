import type { Metadata } from "next";
import { getSession } from "@/utils/session";
import NotificationQueue from "@/components/Notifications/NotificationQueue";

export const metadata: Metadata = { title: "Notification queue" };

export default async function NotificationQueuePage() {
  const { authenticated, client } = await getSession();

  return <NotificationQueue queue={authenticated ? await client.listNotifications() : []} />;
}
