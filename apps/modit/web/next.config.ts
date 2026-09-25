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
      // Inventory page removed — stock is managed in admin products
      { source: "/inventory", destination: "/admin/products", permanent: false },
    ];
  },
};

export default nextConfig;
