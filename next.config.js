/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // don’t fail production builds on ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // (optional) don’t fail the build on TS type errors
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
