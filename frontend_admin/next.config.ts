import type { NextConfig } from "next";

const backendInternal = process.env.BACKEND_INTERNAL_URL || 'http://localhost:8000';

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  async rewrites() {
    return [
      {
        source: "/media/:path*",
        destination: `${backendInternal}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
