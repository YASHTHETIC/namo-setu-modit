// Forwards same-origin /api/* calls to the backend. The frontend uses a
// relative API base, so on Vercel this rewrite is what connects the app
// to https://api.modit.in (override with MODIT_API_ORIGIN at build time).
// On the VPS, nginx proxies /api/ directly and this file is inert.
const API_ORIGIN = process.env.MODIT_API_ORIGIN || "https://api.modit.in";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
