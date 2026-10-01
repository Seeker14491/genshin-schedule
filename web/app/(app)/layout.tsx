import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ApiError } from "@/utils/api";
import { getSession } from "@/utils/session";
import ConfigProvider from "@/components/ConfigProvider";
import AppShell from "@/components/AppShell";

/** Layout for pages that require signing in (or continuing without signing in). */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const { signedIn, authenticated, language, client, renderTime } = await getSession();

  if (!signedIn) {
    redirect("/");
  }

  let data = null;

  if (authenticated) {
    try {
      data = await client.getSync();
    } catch (e) {
      // the token is no longer valid, e.g. because the account was deleted
      if (e instanceof ApiError && e.status === 401) {
        redirect("/sign-out");
      }

      throw e;
    }
  }

  return (
    <ConfigProvider initial={data} language={language} renderTime={renderTime}>
      <AppShell>{children}</AppShell>
    </ConfigProvider>
  );
}
