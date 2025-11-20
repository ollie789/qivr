import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9001',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'prium.github.io',
        pathname: '/aurora/images/**',
      },
    ],
  },
};

export default nextConfig;
