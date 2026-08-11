import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";

/**
 * Where the dashboard sends authenticated users whose e-mail is not on the
 * allowlist: sign them out so they can try another account, and explain
 * why on the login page.
 */
export async function GET(request: Request) {
  await auth.signOut();
  return NextResponse.redirect(new URL("/login?feil=ingen-tilgang", request.url));
}
