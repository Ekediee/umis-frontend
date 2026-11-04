import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ["@base-ui/react"],
  // Lecturer API docs for the backend team: a static page, public on every environment.
  async rewrites() {
    return [{ source: "/lecturer/api-docs", destination: "/docs/lecturer-api.html" }];
  },
  images: {
    remotePatterns: [
      // Backend (HTTPS — production / when cert is valid)
      {
        protocol: "https",
        hostname: "umis-sb.babcock.edu.ng",
        pathname: "/**",
      },
      // Backend (HTTP — dev env uses http://umis-sb... in API_URL)
      {
        protocol: "http",
        hostname: "umis-sb.babcock.edu.ng",
        pathname: "/**",
      },
    ],
  },

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
  }
};

export default withSerwist(nextConfig);
