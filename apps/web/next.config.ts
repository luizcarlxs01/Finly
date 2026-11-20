import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
    if (process.env.NODE_ENV !== "development" || !apiUrl) return [];
    return [{ source: "/finly-api/:path*", destination: `${apiUrl}/:path*` }];
  },
};

export default nextConfig;
