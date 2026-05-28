import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  transpilePackages: ["@base-ui/react"],
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: [
        "**/node_modules/**",
        "**/.next/**",
        "**/public/sw.js",
        "**/public/sw.js.map",
        "**/public/swe-worker-*.js",
        "**/public/swe-worker-*.js.map",
      ],
    }
    return config
  },
  turbopack: {},
};

export default withSerwist(nextConfig);
