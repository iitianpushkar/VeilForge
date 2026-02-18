import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @aztec/bb.js uses Node's worker_threads; Turbopack's NFT can't trace it.
  // serverExternalPackages ensures it's required at runtime instead of bundled.
  serverExternalPackages: ["@aztec/bb.js"],
};

export default nextConfig;
