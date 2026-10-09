import { expect, test } from "@playwright/test";
import { BASE_URL } from "../../playwright.config";
import { closeDb, deleteSpotifyUser } from "./helpers/db";

// Library header (shared with the Create home: TabHeader) and the empty state.
// Rows, ordering and the mini player are in navigation.spec and mini-player.spec.

// The fake Spotify's "fresh-" user (tests/e2e/helpers/fake-spotify.ts): a
// brand-new Spotify user with no tracks. Only this spec creates it.
const FRESH_USER = "mozart-fresh-user";

test.afterAll(async () => {
  await closeDb();
});

test("Library has Create's header: Mozart, profile menu, title and track count; Log out works there", async ({ page }) => {
  await page.request.post("/auth/dummy");
  await page.goto("/library");

  await expect(page.getByText("Mozart", { exact: true })).toBeVisible();
  const title = page.getByRole("heading", { level: 1, name: "Library" });
  await expect(title).toHaveCSS("font-size", "24px");
  const count = page.getByText(/^\d+ tracks?$/);
  await expect(count).toHaveCSS("font-size", "15px");
  await expect(count).toHaveCSS("line-height", "21px");

  const profile = page.getByRole("button", { name: "Profile" });
  await expect(profile).toHaveText("A");
  await profile.click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  await page.goto("/library");
  await expect(page).toHaveURL("/");
});

test("a brand-new user's Library: 0 tracks, Nothing here yet, and a button to Create", async ({ browser }) => {
  // Cleaned up here rather than in beforeAll/afterAll, which every parallel worker runs.
  await deleteSpotifyUser(FRESH_USER);
  const ctx = await browser.newContext();
  try {
    await ctx.addCookies([{ name: "fake_spotify_scenario", value: "fresh-ok", url: BASE_URL }]);
    const page = await ctx.newPage();
    await page.goto("/");
    await page.getByRole("link", { name: "Connect Spotify to get started" }).click();
    await expect(page).toHaveURL("/create");
    await expect(page.getByRole("button", { name: "Profile" })).toHaveText("F");

    await page.getByRole("link", { name: "Library" }).click();
    await expect(page).toHaveURL("/library");
    await expect(page.getByText("0 tracks", { exact: true })).toBeVisible();
    await expect(page.getByText("Nothing here yet")).toBeVisible();
    await expect(page.locator('a[href^="/track/"]')).toHaveCount(0);

    await page.getByRole("link", { name: "Make your first track" }).click();
    await expect(page).toHaveURL("/create");
    await expect(page.getByRole("heading", { name: "What do you want to make?" })).toBeVisible();
  } finally {
    await ctx.close();
    await deleteSpotifyUser(FRESH_USER);
  }
});
