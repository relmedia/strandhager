import path from "node:path";
import type { NextConfig } from "next";

/**
 * Response headers that cost nothing and close common holes. A full
 * Content-Security-Policy is a separate project (Next's inline scripts need
 * nonces, and GSAP, Turnstile, Norkart and Blob all need allowances);
 * frame-ancestors is the part that matters most and works without them.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];

const nextConfig: NextConfig = {
  // Monorepo root (pnpm-workspace) — nested apps/web/.git otherwise traps Turbopack.
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    // 90 is used by the fullscreen gallery lightbox.
    qualities: [75, 90],
    // Admin uploads land in Vercel Blob in production.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
