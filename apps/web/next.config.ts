import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@cp-dashboard/types"],

  // Enable standalone output for Docker/Railway deployment
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,

  // Silence the multiple lockfiles warning in monorepo
  experimental: {},
};

export default nextConfig;
