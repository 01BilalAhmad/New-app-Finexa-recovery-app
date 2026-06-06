import type { NextConfig } from "next";

const FINEXA_API = "https://alfalah-traders.vercel.app";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Proxy all /api/* requests to the Finexa AFE website backend
  // This avoids CORS issues — browser thinks it's same-origin
  async rewrites() {
    return [
      // Route tracking — map /api/tracking/* → /api/route-sessions/*
      {
        source: "/api/tracking/start",
        destination: `${FINEXA_API}/api/route-sessions/start`,
      },
      {
        source: "/api/tracking/end",
        destination: `${FINEXA_API}/api/route-sessions/end`,
      },
      {
        source: "/api/tracking/location",
        destination: `${FINEXA_API}/api/route-sessions/location`,
      },
      {
        source: "/api/tracking/locations-batch",
        destination: `${FINEXA_API}/api/route-sessions/locations-batch`,
      },
      {
        source: "/api/tracking/active",
        destination: `${FINEXA_API}/api/route-sessions/active`,
      },
      {
        source: "/api/tracking/history",
        destination: `${FINEXA_API}/api/route-sessions/history`,
      },
      {
        source: "/api/tracking/live",
        destination: `${FINEXA_API}/api/route-sessions/live`,
      },
      // Catch-all — proxy remaining /api/* to Finexa backend
      {
        source: "/api/:path*",
        destination: `${FINEXA_API}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
