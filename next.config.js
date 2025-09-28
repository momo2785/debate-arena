/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [], // leave empty unless you’re pulling remote images
  },
};

module.exports = nextConfig;
