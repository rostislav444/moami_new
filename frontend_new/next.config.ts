import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    instrumentationHook: true,
  },
  async rewrites() {
    return [
      {
        source: '/p-:slug',
        destination: '/product/:slug',
      },
      {
        source: '/lp-:slug',
        destination: '/product_landing/:slug',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'moami.com.ua',
        port: '',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'moami.com.ua',
        port: '',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
