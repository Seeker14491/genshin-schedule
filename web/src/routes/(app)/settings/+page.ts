import { isAuthenticated } from "#lib/utils/api.ts";
import { createApiClient, getAuthToken } from "#lib/utils/auth.ts";

export async function load({ fetch }) {
  // account details are only shown to signed-in users
  return { user: isAuthenticated(getAuthToken()) ? await createApiClient(fetch).getSelf() : null };
}
