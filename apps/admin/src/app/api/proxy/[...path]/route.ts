import { cookies } from "next/headers";

import { API_URL } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/auth/session";

/**
 * Forwards dashboard requests to the API with the session token attached.
 *
 * The token lives in an httpOnly cookie, so client components cannot read it
 * to set an Authorization header themselves. Rather than rewrite every data
 * call as a server action, they go through here: the hop runs on the server,
 * reads the cookie, and adds the header upstream. The token never reaches the
 * browser, and the cookie itself is never forwarded on.
 */

/** Hop-by-hop and request-specific headers that must not be relayed. */
const STRIPPED = new Set([
  "cookie",
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "accept-encoding",
]);

async function forward(request: Request, path: string[]): Promise<Response> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  const incoming = new URL(request.url);
  const target = new URL(`${API_URL}/${path.map(encodeURIComponent).join("/")}`);
  target.search = incoming.search;

  const headers = new Headers();
  for (const [key, value] of request.headers) {
    if (!STRIPPED.has(key.toLowerCase())) headers.set(key, value);
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  const response = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.text() : undefined,
    cache: "no-store",
    redirect: "manual",
  });

  // Relayed as-is so the existing error handling in lib/api.ts keeps reading
  // the API's own messages rather than something this hop invented.
  const body = await response.arrayBuffer();
  const out = new Headers();
  const contentType = response.headers.get("content-type");
  if (contentType) out.set("content-type", contentType);

  return new Response(body, { status: response.status, headers: out });
}

const handler = async (
  request: Request,
  context: RouteContext<"/api/proxy/[...path]">,
) => {
  const { path } = await context.params;
  return forward(request, path);
};

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
