import type { Metadata } from "next";
import { getSession } from "@/utils/session";
import Settings from "@/components/Settings/Settings";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { authenticated, client } = await getSession();

  return <Settings user={authenticated ? await client.getSelf() : null} />;
}
