/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: '*.firebasestorage.googleapis.com' },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
