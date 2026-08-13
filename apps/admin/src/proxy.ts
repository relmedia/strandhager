import { NextRequest, NextResponse } from "next/server";

import { AUTH_LOGIN_PATH } from "@/lib/auth";
import { readSession, SESSION_COOKIE } from "@/lib/auth/session";

/**
 * Protects dashboard routes. The JWT lives in an httpOnly cookie set after
 * the one-time login code is confirmed.
 */
export default async function proxy(request: NextRequest) {
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const login = new URL(AUTH_LOGIN_PATH, request.url);
    const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    if (next !== AUTH_LOGIN_PATH) {
      login.searchParams.set("redirectTo", next);
    }
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|api/no-access|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
