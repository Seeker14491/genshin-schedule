import { redirect } from "@sveltejs/kit";
import { setAuthToken } from "#lib/utils/auth.ts";

/** Clears the auth cookie and returns to the welcome page. */
export function load() {
  setAuthToken(undefined);
  redirect(307, "/");
}
