import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/namo",
  output: "standalone",
  transpilePackages: ["@foundation/ui", "@foundation/utils", "@foundation/api-client"],
};

export default nextConfig;
