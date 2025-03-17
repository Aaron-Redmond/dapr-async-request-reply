import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    nodeMiddleware: true,
  },
  serverExternalPackages: ["@dapr/dapr"],
  output: 'standalone', // Generates a standalone build
};

export default nextConfig;
