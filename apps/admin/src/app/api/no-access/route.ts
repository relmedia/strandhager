import { NextResponse } from "next/server";

import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/session";

/**
 * Where the dashboard sends authenticated users whose e-mail is not on the
 * allowlist: drop the session so they can try another account, and explain
 * why on the login page.
 */
export async function GET(request: Request) {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return NextResponse.redirect(new URL("/login?feil=ingen-tilgang", request.url));
}
