import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The e2e production-gate check runs a second dev server in its own dir.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // The dev-only design PNG route reads docs/ at runtime on Vercel previews.
  outputFileTracingIncludes: {
    "/dev/designs/[id]": ["./docs/designs/png/**"],
    // Open Graph images read DM Sans from assets/fonts at runtime.
    "/opengraph-image": ["./assets/fonts/**"],
    "/track/[slug]/opengraph-image": ["./assets/fonts/**"],
    "/track/[slug]/twitter-image": ["./assets/fonts/**"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
