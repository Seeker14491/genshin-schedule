import { redirect } from "@sveltejs/kit";
import { getAuthToken } from "#lib/utils/auth.ts";
import { startSession } from "#lib/session.svelte.ts";

export async function load({ fetch }) {
  // visitors who signed in or chose to continue without signing in go straight to the app
  if (getAuthToken() !== undefined) {
    redirect(307, "/home");
  }

  await startSession(fetch);
}
