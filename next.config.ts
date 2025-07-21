import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Suppress specific webpack warnings
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on node modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;