import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // produces a self-contained server in .next/standalone for the Docker image
  output: "standalone",
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
  allowedDevOrigins: ['*.trycloudflare.com'],
};

export default nextConfig;
