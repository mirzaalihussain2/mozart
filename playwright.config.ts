import { defineConfig, devices } from "@playwright/test";

// Always 127.0.0.1, never localhost (AGENTS.md §3). The e2e app runs on its
// own port and build dir, never reusing a dev server: it talks to the fake
// Spotify (tests/e2e/helpers/fake-spotify.ts), not the real one.
export const BASE_URL = "http://127.0.0.1:3001";
export const FAKE_SPOTIFY_URL = "http://127.0.0.1:4545";
export const PROD_CHECK_URL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
      },
    },
  ],
  webServer: [
    {
      command: "pnpm exec tsx tests/e2e/helpers/fake-spotify.ts",
      url: `${FAKE_SPOTIFY_URL}/health`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: "pnpm exec next dev -H 127.0.0.1 -p 3001",
      env: {
        NEXT_DIST_DIR: ".next-e2e",
        APP_URL: BASE_URL,
        SPOTIFY_CLIENT_ID: "fake-client-id",
        SPOTIFY_CLIENT_SECRET: "fake-client-secret",
        SPOTIFY_ACCOUNTS_URL: FAKE_SPOTIFY_URL,
        SPOTIFY_API_URL: FAKE_SPOTIFY_URL,
      },
      url: BASE_URL,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    // Same app with VERCEL_ENV=production, to check /dev/* is hidden there.
    {
      command: "pnpm exec next dev -H 127.0.0.1 -p 3100",
      env: { NEXT_DIST_DIR: ".next-prodcheck", VERCEL_ENV: "production" },
      url: `${PROD_CHECK_URL}/`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
