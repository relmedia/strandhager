import { NextRequest } from "next/server";

import { auth } from "@/lib/auth/server";

const neonAuthMiddleware = auth.middleware({
  loginUrl: "/login",
});

/**
 * Neon Auth's middleware (0.4.2-beta) forwards the incoming request method to
 * the upstream `get-session` endpoint, which only accepts GET. Server actions
 * POST to the page URL, so without this the session check 404s and the
 * middleware redirects the action to /login ("An unexpected response was
 * received from the server"). Coerce the session check to GET as a workaround.
 */
export default async function proxy(request: NextRequest) {
  if (request.method === "GET") {
    return neonAuthMiddleware(request);
  }

  const asGet = new NextRequest(new URL(request.url), {
    headers: request.headers,
  });
  return neonAuthMiddleware(asGet);
}

export const config = {
  matcher: [
    /*
     * Protect all app routes except Next internals, static assets, auth API,
     * and the login page itself.
     */
    "/((?!_next/static|_next/image|favicon.ico|login|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
