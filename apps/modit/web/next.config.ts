import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@foundation/ui", "@foundation/utils", "@foundation/api-client"],
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async redirects() {
    return [
      // Removed buyer pages — managed in admin only
      { source: "/inventory", destination: "/admin/products", permanent: false },
      { source: "/suppliers", destination: "/admin/suppliers", permanent: false },
    ];
  },
};

export default nextConfig;
