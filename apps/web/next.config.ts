import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo root (pnpm-workspace) — nested apps/web/.git otherwise traps Turbopack.
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  images: {
    // 90 is used by the fullscreen gallery lightbox.
    qualities: [75, 90],
  },
};

export default nextConfig;
