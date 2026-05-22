import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@repo/database", "@repo/shared", "@repo/ui", "@repo/cms"],
};

export default nextConfig;
