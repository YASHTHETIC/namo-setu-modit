import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@foundation/ui", "@foundation/utils", "@foundation/api-client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
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
