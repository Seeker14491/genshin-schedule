import type { Metadata } from "next";
import NotificationSetup from "@/components/Notifications/NotificationSetup";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return <NotificationSetup />;
}
