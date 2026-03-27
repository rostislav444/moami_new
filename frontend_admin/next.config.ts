import type { NextConfig } from "next";

const backendInternal = process.env.BACKEND_INTERNAL_URL || 'http://localhost:8000';

const nextConfig: NextConfig = {
  output: 'standalone',
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
