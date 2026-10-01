import { NextRequest, NextResponse } from "next/server";
import { AuthCookie } from "@/utils/api";

/** Clears the auth cookie and returns to the welcome page. */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete(AuthCookie);
  return response;
}
