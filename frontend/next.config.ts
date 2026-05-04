import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

const config: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: 500 * 1024 * 1024, // 500MB
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default config;
