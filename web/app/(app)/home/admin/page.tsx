import type { Metadata } from "next";
import { getSession } from "@/utils/session";
import AdminTools from "@/components/Admin/AdminTools";

export const metadata: Metadata = { title: "Admin Tools" };

export default async function AdminPage() {
  const { authenticated, client } = await getSession();

  return <AdminTools user={authenticated ? await client.getSelf() : null} />;
}
