import { cookies, headers } from "next/headers";
import { pick as pickLanguage } from "accept-language-parser";
import { ApiClient, ApiUrlInternal, AuthCookie, isAuthenticated } from "./api";
import { Language, LanguageAliases } from "@/langs";

/** Reads the current user's auth token and preferred language. Server only. */
export async function getSession() {
  const token = (await cookies()).get(AuthCookie)?.value;
  const acceptLanguage = (await headers()).get("accept-language") || "";
  const alias = pickLanguage(Object.keys(LanguageAliases), acceptLanguage) || "";

  return {
    /** Time at which the page is being rendered. */
    renderTime: Date.now(),
    /** Whether the user signed in or chose to continue without signing in. */
    signedIn: token !== undefined,
    authenticated: isAuthenticated(token),
    language: (LanguageAliases[alias] || null) as Language | null,
    client: new ApiClient(ApiUrlInternal, token),
  };
}
