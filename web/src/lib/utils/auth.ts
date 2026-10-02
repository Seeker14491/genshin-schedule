import { PUBLIC_API_URL } from "$app/env/public";
import { ApiClient, AuthCookie } from "./api";

// browsers cap cookie lifetime at 400 days
const MaxAge = 400 * 24 * 60 * 60;

/** Returns the auth token from the cookie: a token, "null" for users who continue without signing in, or undefined. */
export function getAuthToken(): string | undefined {
  for (const cookie of document.cookie.split("; ")) {
    const [name, ...value] = cookie.split("=");

    if (name === AuthCookie) {
      return decodeURIComponent(value.join("="));
    }
  }
}

export function setAuthToken(token: string | undefined) {
  if (token) {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${AuthCookie}=${encodeURIComponent(token)}; Path=/; Max-Age=${MaxAge}; SameSite=Lax${secure}`;
  } else {
    document.cookie = `${AuthCookie}=; Path=/; Max-Age=0`;
  }
}

/** Creates an API client authenticated as the current user. Load functions should pass the `fetch` they are given. */
export function createApiClient(fetchFn?: typeof fetch) {
  return new ApiClient(PUBLIC_API_URL, getAuthToken(), fetchFn);
}
