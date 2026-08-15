import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@foundation/ui", "@foundation/utils", "@foundation/api-client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
