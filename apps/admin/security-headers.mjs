/**
 * Response headers that cost nothing and close common holes. Shared shape
 * with apps/web; kept per app so each can loosen its own if ever needed.
 *
 * A full Content-Security-Policy is deliberately not here yet: Next's inline
 * scripts need per-request nonces, which is a project of its own. frame-
 * ancestors is the part of CSP that matters most and works without them.
 */
export const securityHeaders = [
  // Nobody may show the dashboard inside their own page (clickjacking).
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];
