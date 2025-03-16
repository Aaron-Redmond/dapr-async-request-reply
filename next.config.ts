import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    nodeMiddleware: true,
  },
  serverExternalPackages: ["@dapr/dapr"]
};

export default nextConfig;
