import { redirect } from "@sveltejs/kit";
import { getAuthToken } from "#lib/utils/auth.ts";
import { startSession } from "#lib/session.svelte.ts";

/** Pages in this group require signing in, or choosing to continue without signing in. */
export async function load({ fetch }) {
  if (getAuthToken() === undefined) {
    redirect(307, "/");
  }

  await startSession(fetch);

  // the token is removed if the server rejected it, e.g. because the account was deleted
  if (getAuthToken() === undefined) {
    redirect(307, "/");
  }
}
