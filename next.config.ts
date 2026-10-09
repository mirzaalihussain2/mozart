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
