import { redirect } from "next/navigation";
import { getSession } from "@/utils/session";
import ConfigProvider from "@/components/ConfigProvider";
import AppShell from "@/components/AppShell";
import Welcome from "@/components/Welcome/Welcome";

export default async function WelcomePage() {
  const { signedIn, language, renderTime } = await getSession();

  if (signedIn) {
    redirect("/home");
  }

  return (
    <ConfigProvider language={language} renderTime={renderTime}>
      <AppShell header={false}>
        <Welcome />
      </AppShell>
    </ConfigProvider>
  );
}
