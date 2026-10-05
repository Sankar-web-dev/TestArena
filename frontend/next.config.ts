import type { NextConfig } from "next";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3006";

const nextConfig: NextConfig = {
  /**
   * Proxy all API calls through the frontend origin.
   *
   * The NestJS backend (Better Auth) lives on a different domain.
   * Routing /api/* through this origin keeps the session cookie
   * first-party: it is set on THIS domain by the proxy response
   * and sent on every subsequent request — no cross-site cookie
   * problems, no CORS on the client.
   */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
