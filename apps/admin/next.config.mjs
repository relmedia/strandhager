import { securityHeaders } from "./security-headers.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  transpilePackages: ["@cabin/ui"],
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Next.js 16 logs Server Action args in dev by default — disable so
  // login credentials are never printed to the terminal.
  logging: {
    serverFunctions: false,
  },
  // The dashboard is private: no framing, no sniffing, no stray referrers.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  experimental: {
    serverActions: {
      // Image uploads go through a Server Action; default is 1 MB.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
