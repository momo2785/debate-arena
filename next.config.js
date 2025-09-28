/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/ask',
        permanent: false, // change to true later if you want SEO permanence
      },
    ]
  },
}

module.exports = nextConfig
