import type { NextConfig } from "next";

// Same-origin /api/* forwarding to the backend. The frontend uses a relative
// API base; on Vercel this rewrite connects the app to api.modit.in
// (override with MODIT_API_ORIGIN at build time). On the VPS, nginx proxies
// /api/ directly so this never triggers there.
const API_ORIGIN = process.env.MODIT_API_ORIGIN || "https://api.modit.in";

const nextConfig: NextConfig = {
  transpilePackages: ["@foundation/ui", "@foundation/utils", "@foundation/api-client"],
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async redirects() {
    return [
      // Removed buyer pages - managed in admin only
      { source: "/inventory", destination: "/admin/products", permanent: false },
      { source: "/suppliers", destination: "/admin/suppliers", permanent: false },
    ];
  },
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
