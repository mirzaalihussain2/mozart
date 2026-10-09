import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { BASE_URL } from "../../playwright.config";
import { closeDb, deleteSpotifyUser, deleteTracks, spotifyUser, trackRow } from "./helpers/db";
import type { Scenario } from "./helpers/fake-spotify";
import { CANDICE, CANDICE_KILL_BILL, DEREK, DEREK_LATCH } from "./helpers/personas";

// Milestone 7: real Spotify sign-in against a fake Spotify (scenario per
// browser via the fake_spotify_scenario cookie). The fixture user is "ali";
// failures become Candice (or Derek from one of her tracks), "Log in" is Derek.

const FIXTURE_USER = "mozart-fixture-user";
const created: string[] = [];

// One worker: every test signs in as the same fixture Spotify user.
test.describe.configure({ mode: "default" });

test.afterEach(async () => {
  await deleteTracks(created.splice(0));
});
test.afterAll(async () => {
  await deleteSpotifyUser(FIXTURE_USER);
  await closeDb();
});

async function withScenario(browser: Browser, scenario: Scenario): Promise<BrowserContext> {
  const ctx = await browser.newContext();
  await ctx.addCookies([{ name: "fake_spotify_scenario", value: scenario, url: BASE_URL }]);
  ctx.on("response", async (res) => {
    if (res.url().endsWith("/api/generate") && res.status() === 201) {
      const body = (await res.json().catch(() => null)) as { track?: { slug: string } } | null;
      if (body?.track) created.push(body.track.slug);
    }
  });
  return ctx;
}

const SCDN = /^https:\/\/i\.scdn\.co\/image\//;
const me = async (page: Page) => (await (await page.request.get("/api/me")).json()).user as { id: string; firstName: string } | null;
const hasOAuthCookie = async (ctx: BrowserContext) => (await ctx.cookies(`${BASE_URL}/auth/spotify/callback`)).some((c) => c.name === "mozart_oauth");

test("ok: Connect Spotify signs in the Spotify user, whose top tracks and artists fill the pickers", async ({ browser }) => {
  const ctx = await withScenario(browser, "ok");
  const page = await ctx.newPage();
  await page.goto("/");
  await page.getByRole("link", { name: "Connect Spotify to get started" }).click();
  await expect(page).toHaveURL("/create");

  const user = await me(page);
  expect(user?.firstName).toBe("Ali");
  expect([DEREK.id, CANDICE.id]).not.toContain(user?.id);
  expect(await spotifyUser(FIXTURE_USER)).toMatchObject({ id: user!.id, first_name: "Ali", auth_provider: "spotify" });
  expect(await hasOAuthCookie(ctx)).toBe(false);
  // The profile circle shows their Spotify photo, on Create and on Library.
  await expect(page.getByRole("button", { name: "Profile" }).locator("img")).toHaveAttribute("src", SCDN);
  await page.getByRole("link", { name: "Library" }).click();
  await expect(page).toHaveURL("/library");
  await expect(page.getByRole("button", { name: "Profile" }).locator("img")).toHaveAttribute("src", SCDN);
  await page.getByRole("link", { name: "Create", exact: true }).click();
  await expect(page).toHaveURL("/create");

  // Remix song picker: the fixture's top tracks, cleaned and de-duplicated.
  await page.getByRole("link", { name: /^Remix/ }).click();
  await expect(page.getByRole("link", { name: "Way Too Self Aware by Ian Asher" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Blackbird by The Beatles" })).toBeVisible();
  const labels = await page.locator('a[href^="/create/remix/"]').evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  expect(labels).toHaveLength(20);
  expect(new Set(labels).size).toBe(labels.length);
  await expect(page.getByRole("link", { name: "Cruel Summer by Taylor Swift" })).toHaveCount(0);

  // Every tile shows its real album cover.
  const covers = await page.locator('a[href^="/create/remix/"] img').evaluateAll((els) => els.map((e) => e.getAttribute("src")));
  expect(covers).toHaveLength(20);
  for (const src of covers) expect(src).toMatch(SCDN);

  // Generate a remix: named after the real top track; step 2's card shows its cover.
  await page.getByRole("link", { name: "Way Too Self Aware by Ian Asher" }).click();
  await expect(page.getByRole("link", { name: "Way Too Self Aware by Ian Asher, change song" }).locator("img")).toHaveAttribute("src", SCDN);
  await page.getByRole("radio", { name: "Bollywood" }).click();
  await page.getByRole("button", { name: "Generate remix" }).click();
  await page.waitForURL(/\/track\/[0-9a-z]{10}$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Way Too Self Aware × Bollywood" })).toBeVisible();

  // From the player, the card is the generated track: still a placeholder.
  await page.goto(`${new URL(page.url()).pathname}/remix`);
  await expect(page.getByRole("link", { name: "Way Too Self Aware × Bollywood Ali, back to the player" })).toHaveText(/^A/);
  await expect(page.locator("main img")).toHaveCount(0);

  // Cover singers are their top artists, with their photos.
  await page.goto("/create/cover");
  await page.getByRole("link", { name: "Blackbird by The Beatles" }).click();
  await expect(page.getByRole("radio", { name: /Fred again\.\./ })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Fred again\.\./ }).locator("img")).toHaveAttribute("src", SCDN);
  await expect(page.getByRole("radio", { name: /Arijit Singh/ })).toHaveCount(0);
  await ctx.close();
});

for (const scenario of ["deny", "forbidden", "slow", "bad_state"] as const) {
  test(`${scenario}: silently becomes Candice at the same destination`, async ({ browser }) => {
    const ctx = await withScenario(browser, scenario);
    const page = await ctx.newPage();
    await page.goto("/");
    await page.getByRole("link", { name: "Connect Spotify to get started" }).click();
    await expect(page).toHaveURL("/create", { timeout: 15_000 });
    expect((await me(page))?.id).toBe(CANDICE.id);
    await expect(page.getByText(/spotify/i)).toHaveCount(0);
    expect(await hasOAuthCookie(ctx)).toBe(false);
    // Candice has her own top songs, with real covers.
    await page.getByRole("link", { name: /^Remix/ }).click();
    await expect(page.getByRole("link", { name: "Kill Bill by SZA" }).locator("img")).toHaveAttribute("src", SCDN);
    await ctx.close();
  });
}

test("the recipient loop through Spotify: their anonymous track is claimed by the Spotify user", async ({ browser }) => {
  const friend = await withScenario(browser, "ok");
  const page = await friend.newPage();
  await page.goto(`/track/${DEREK_LATCH.slug}`);
  await page.getByRole("link", { name: "Remix", exact: true }).click();
  await page.getByRole("radio", { name: "Drill" }).click();
  await page.getByRole("button", { name: "Generate remix" }).click();
  await page.waitForURL(/\/track\/[0-9a-z]{10}$/, { timeout: 15_000 });
  const theirSlug = new URL(page.url()).pathname.split("/")[2];

  await page.getByRole("button", { name: "Send to Derek" }).click();
  await page.getByRole("dialog", { name: "Send to Derek" }).getByRole("link", { name: "Continue with Spotify" }).click();
  await expect(page).toHaveURL(`/track/${theirSlug}`);
  await expect(page.getByRole("dialog", { name: "Share this track" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Signed in · saved to your library" })).toBeVisible();

  const spotify = await spotifyUser(FIXTURE_USER);
  expect(await trackRow(theirSlug)).toMatchObject({ owner: spotify!.id, anon: null });
  await friend.close();
});

test("'Log in' is Derek with his own songs; another user's song id is a 400", async ({ browser }) => {
  const ctx = await withScenario(browser, "ok");
  const page = await ctx.newPage();
  await page.goto("/");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/create");
  expect((await me(page))?.id).toBe(DEREK.id);
  await expect(page.getByRole("button", { name: "Profile" })).toHaveText("D");
  await expect(page.getByRole("button", { name: "Profile" }).locator("img")).toHaveCount(0);
  await page.getByRole("link", { name: /^Remix/ }).click();
  // His 20 top songs, every one with its real cover; none of the mock songs.
  await expect(page.getByRole("link", { name: "Latch by Disclosure" }).locator("img")).toHaveAttribute("src", SCDN);
  await expect(page.locator('a[href^="/create/remix/"] img')).toHaveCount(20);
  await expect(page.getByRole("link", { name: "Cruel Summer by Taylor Swift" })).toHaveCount(0);

  // "Way Too Self Aware" (the fixture user's song) isn't in Derek's catalogue.
  const res = await page.request.post("/api/generate", { data: { mode: "remix", sourceSongId: "2rkUhGw5iWbBY1PE5AnCl8", genreId: "bollywood" } });
  expect(res.status()).toBe(400);
  await ctx.close();
});

test("a failed sign-in from one of Candice's tracks becomes Derek, who gets the friend's track", async ({ browser }) => {
  const friend = await withScenario(browser, "forbidden");
  const page = await friend.newPage();
  await page.goto(`/track/${CANDICE_KILL_BILL.slug}`);
  await expect(page.getByText("Sent by Candice")).toBeVisible();
  await page.getByRole("link", { name: "Cover", exact: true }).click();
  await page.getByRole("radio", { name: "Arijit Singh" }).click();
  await page.getByRole("button", { name: "Generate cover" }).click();
  await page.waitForURL(/\/track\/[0-9a-z]{10}$/, { timeout: 15_000 });
  const theirSlug = new URL(page.url()).pathname.split("/")[2];
  await expect(page.getByRole("heading", { name: "Kill Bill × Arijit Singh" })).toBeVisible();

  await page.getByRole("button", { name: "Send to Candice" }).click();
  await page.getByRole("dialog", { name: "Send to Candice" }).getByRole("link", { name: "Continue with Spotify" }).click();
  await expect(page).toHaveURL(`/track/${theirSlug}`);
  await expect(page.getByRole("status").filter({ hasText: "Signed in · saved to your library" })).toBeVisible();
  expect((await me(page))?.id).toBe(DEREK.id);
  expect(await trackRow(theirSlug)).toMatchObject({ owner: DEREK.id, anon: null });
  await friend.close();
});

// Step 1's picker (02-01 / 02-03 / 02-05) with the fixture's 20 top tracks.
async function pickerAsSpotifyUser(browser: Browser) {
  const ctx = await withScenario(browser, "ok");
  const page = await ctx.newPage();
  await page.goto("/");
  await page.getByRole("link", { name: "Connect Spotify to get started" }).click();
  await expect(page).toHaveURL("/create");

  const order = async (mode: string) => {
    const tiles = page.locator(`a[href^="/create/${mode}/"]`);
    await expect(tiles).toHaveCount(20);
    return (await tiles.evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")))).join("\n");
  };
  const visit = async (mode: "Remix" | "Cover") => {
    await page.goto("/create");
    await page.getByRole("link", { name: new RegExp(`^${mode}`) }).click();
    await expect(page).toHaveURL(`/create/${mode.toLowerCase()}`);
    return order(mode.toLowerCase());
  };
  return { ctx, page, order, visit };
}

test("step 1 reshuffles the songs on every visit from Create, with its own order per mode", async ({ browser }) => {
  const { ctx, visit } = await pickerAsSpotifyUser(browser);
  // A uniform shuffle: two orders of 20 match by chance about once in
  // 2.4 × 10^18, so three visits are never all the same.
  const remix = [await visit("Remix"), await visit("Remix"), await visit("Remix")];
  expect(new Set(remix).size).toBeGreaterThan(1);
  expect(new Set(remix.map((o) => o.split("\n").sort().join("\n"))).size).toBe(1);
  expect(await visit("Cover")).not.toBe(remix[2]);
  await ctx.close();
});

test("step 1 keeps its order coming back from step 2 (browser Back, Back pill, change song) and on reload; search keeps it", async ({ browser }) => {
  const { ctx, page, order, visit } = await pickerAsSpotifyUser(browser);
  const seen = await visit("Remix");
  const song = page.getByRole("link", { name: "Blackbird by The Beatles" });
  await song.click();
  await expect(page).toHaveURL(/\/create\/remix\/.+/);
  await page.goBack();
  expect(await order("remix")).toBe(seen);
  await song.click();
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL("/create/remix");
  expect(await order("remix")).toBe(seen);
  await song.click();
  await page.getByRole("link", { name: "Blackbird by The Beatles, change song" }).click();
  await expect(page).toHaveURL("/create/remix");
  expect(await order("remix")).toBe(seen);
  await page.reload();
  expect(await order("remix")).toBe(seen);

  // Search filters the shuffled list, in that order.
  const matches = seen.split("\n").filter((label) => label.toLowerCase().includes("the"));
  expect(matches.length).toBeGreaterThan(1);
  expect(matches.length).toBeLessThan(20);
  await page.getByRole("textbox", { name: "Search any song" }).fill("the");
  const tiles = page.locator('a[href^="/create/remix/"]');
  await expect(tiles).toHaveCount(matches.length);
  expect(await tiles.evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")))).toEqual(matches);
  await ctx.close();
});
