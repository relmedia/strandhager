export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Dashboard calls go through the app's own proxy rather than straight to the
 * API, because the session token sits in an httpOnly cookie that client
 * components cannot read. The proxy attaches it server-side; see
 * app/api/proxy/[...path]/route.ts.
 */
const PROXY_PREFIX = "/api/proxy";

type RequestOptions = RequestInit & {
  searchParams?: Record<string, string | number | boolean | undefined>;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const onServer = typeof window === "undefined";

  // Server components render before there is a page to resolve the proxy
  // against, so they call the API directly and pick the token off the cookie
  // themselves. In the browser the proxy does that part.
  const url = onServer
    ? new URL(path.startsWith("http") ? path : `${API_URL}${path}`)
    : new URL(resolve(path), window.location.origin);

  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const { searchParams: _searchParams, ...init } = options;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(onServer ? await serverAuthHeader() : {}),
      ...init.headers,
    },
  });

  // The dashboard's middleware bounces unauthenticated requests to the login
  // page, so an expired session arrives here as HTML rather than an API error.
  // Naming it beats letting response.json() fail on a <!doctype html>.
  if (response.redirected && new URL(response.url).pathname.startsWith("/login")) {
    throw new Error("Sesjonen er utløpt. Logg inn på nytt.");
  }

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<T>;
}

/**
 * An absolute URL stays as it is; anything else is routed through the proxy so
 * the request carries the dashboard's token.
 */
function resolve(path: string): string {
  if (path.startsWith("http")) return path;
  return `${PROXY_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The signed-in admin's token, for calls made while rendering on the server.
 *
 * Both imports are dynamic and inside the server-only path on purpose:
 * `next/headers` cannot be bundled for the browser, and pulling the session
 * module in statically would drag its JWT library into the client bundle.
 */
async function serverAuthHeader(): Promise<Record<string, string>> {
  const [{ cookies }, { SESSION_COOKIE }] = await Promise.all([
    import("next/headers"),
    import("@/lib/auth/session"),
  ]);

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Nest puts the useful text in the body: a string for thrown exceptions, an
 * array of messages for validation failures. Falling back to the status keeps
 * something readable when the body is empty or not JSON.
 */
async function readError(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);

  if (body && typeof body === "object" && "message" in body) {
    const { message } = body as { message: unknown };
    if (Array.isArray(message)) return message.join(". ");
    if (typeof message === "string") return message;
  }

  return `API ${response.status}: ${response.statusText}`;
}
