/**
 * Who a request appears to come from, for rate-limiting purposes.
 *
 * The API sits behind Vercel's proxy, so the socket address is always the
 * proxy's. Vercel sets `x-real-ip` to the client address and maintains
 * `x-forwarded-for`, and both are written by the platform rather than passed
 * through from the caller — which is what makes them usable here. Were this
 * ever moved somewhere that forwards client-supplied headers untouched, these
 * become attacker-controlled and the limits below become decorative.
 *
 * Falls back to the socket address so it still works locally, where there is
 * no proxy at all.
 */
export function clientIp(request: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}): string {
  const realIp = header(request, 'x-real-ip');
  if (realIp) return realIp;

  // Left-most entry is the original client; the rest is the proxy chain.
  const forwarded = header(request, 'x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  return request.ip ?? request.socket?.remoteAddress ?? 'ukjent';
}

function header(
  request: { headers: Record<string, string | string[] | undefined> },
  name: string,
): string | null {
  const value = request.headers[name];
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() ? first.trim() : null;
}
