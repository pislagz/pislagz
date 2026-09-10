import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three", "liquid-glass-react"],
  // Avoid Next 15.5 overlay/segment-explorer manifest crashes in dev.
  devIndicators: false,
  async redirects() {
    return [
      {
        source: "/projects",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
