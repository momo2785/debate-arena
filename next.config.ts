// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },    // ⬅️ skip ESLint in prod builds
  typescript: { ignoreBuildErrors: true }, // ⬅️ skip TS type errors in builds
};

export default nextConfig;
