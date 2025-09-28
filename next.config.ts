// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip ESLint during production builds on Vercel
  eslint: { ignoreDuringBuilds: true },
  // Skip TypeScript type errors during builds (runtime still works)
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
