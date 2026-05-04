import type { NextConfig } from "next";

// API_URL is a server-side env var — evaluated at runtime (not build time).
// In production set it to the backend Render URL, e.g. https://x-analyzer-api.onrender.com
const API_URL = process.env.API_URL || "http://localhost:8000";

const config: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default config;
