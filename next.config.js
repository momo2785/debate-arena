/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/', destination: '/ask', permanent: false }, // community page as homepage
    ];
  },
  // ⬇️ ignore lint/type errors during the Vercel build
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
