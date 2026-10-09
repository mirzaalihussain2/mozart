import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { BASE_URL } from "../../playwright.config";
import { closeDb, deleteTracks, trackRow } from "./helpers/db";
import { CANDICE, DEREK, DEREK_LATCH, songId } from "./helpers/personas";

// Milestone 5: the core loop. Derek shares → a friend with no account makes
// one version → "Send to Derek" → signs in (the fake Spotify refuses, so
// Candice) → lands on their own track, claimed into their library, with the
// share sheet and toast.

const MORE_COPY = "You’ve made your free track. Sign in with Spotify to keep making more. They’ll be saved to your library.";

const created: string[] = [];
test.afterEach(async () => {
  await deleteTracks(created.splice(0));
});
test.afterAll(async () => {
  await closeDb();
});

/** Records every slug POST /api/generate returns in this context, for cleanup. */
function recordCreated(target: Page | BrowserContext) {
  target.on("response", async (res) => {
    if (res.url().endsWith("/api/generate") && res.status() === 201) {
      const body = (await res.json().catch(() => null)) as { track?: { slug: string } } | null;
      if (body?.track) created.push(body.track.slug);
    }
  });
}

const audioPaused = (page: Page) => page.evaluate(() => document.querySelector("audio")!.paused);
const slugOf = (page: Page) => new URL(page.url()).pathname.split("/")[2];

/** Signed in as Derek (the landing "Log in"), or as Candice (a failed Spotify sign-in). */
async function signedIn(browser: Browser, as: "Derek" | "Candice" = "Derek") {
  const ctx = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
  recordCreated(ctx);
  if (as === "Derek") await ctx.request.post("/auth/dummy");
  else await ctx.request.get("/auth/spotify/login?returnTo=/create");
  return ctx;
}

async function stranger(browser: Browser) {
  const ctx = await browser.newContext();
  recordCreated(ctx);
  return ctx;
}

/** On a player: Remix → genre → Generate → wait for the new track. Returns its slug. */
async function remixFromPlayer(page: Page, genre: string) {
  await page.getByRole("link", { name: "Remix", exact: true }).click();
  await page.getByRole("radio", { name: genre }).click();
  await page.getByRole("button", { name: "Generate remix" }).click();
  await page.waitForURL(/\/track\/[0-9a-z]{10}$/, { timeout: 15_000 });
  return slugOf(page);
}

test("the core loop, with two browsers", async ({ browser }) => {
  // 1. Derek makes a track and copies its link.
  const derek = await signedIn(browser);
  const derekPage = await derek.newPage();
  await derekPage.goto(`/create/remix/${songId(DEREK, "Latch")}`);
  await derekPage.getByRole("radio", { name: "Bollywood" }).click();
  await derekPage.getByRole("button", { name: "Generate remix" }).click();
  await derekPage.waitForURL(/\/track\/[0-9a-z]{10}$/, { timeout: 15_000 });
  const derekSlug = slugOf(derekPage);
  await derekPage.getByRole("button", { name: "Share", exact: true }).click();
  await derekPage.getByRole("button", { name: /Copy link/ }).click();
  const link = await derekPage.evaluate(() => navigator.clipboard.readText());
  expect(link).toBe(`${BASE_URL}/track/${derekSlug}`);

  // 2. A friend with no account opens it: recipient view, paused; Play plays.
  const friend = await stranger(browser);
  const page = await friend.newPage();
  await page.goto(link);
  await expect(page.getByText("Sent by Derek")).toBeVisible();
  await page.waitForTimeout(500);
  expect(await audioPaused(page)).toBe(true);
  await page.getByRole("button", { name: "Play" }).click();
  await expect.poll(() => audioPaused(page)).toBe(false);
  expect((await friend.cookies()).some((c) => c.name === "mozart_anon")).toBe(false);

  // …and makes their own: recipient Generating (remix colour, ≥ 3.5 s) → their result.
  await page.getByRole("link", { name: "Remix", exact: true }).click();
  await page.getByRole("radio", { name: "Electronic" }).click();
  const t0 = Date.now();
  await page.getByRole("button", { name: "Generate remix" }).click();
  await expect(page.getByText("“Derek’s Latch, but make it Electronic.”")).toBeVisible();
  await expect(page.locator(".bg-remix").filter({ hasText: "Making your track…" })).toBeVisible();
  await page.waitForURL(/\/track\/[0-9a-z]{10}$/, { timeout: 15_000 });
  expect(Date.now() - t0).toBeGreaterThanOrEqual(3500);
  const theirSlug = slugOf(page);
  expect(theirSlug).not.toBe(derekSlug);
  await expect(page.getByRole("heading", { name: "Latch × Electronic" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send to Derek" })).toBeVisible();
  await expect(page.getByText("You", { exact: true })).toBeVisible();

  // 3. They now have an httpOnly mozart_anon, and the row is unowned with that id.
  const anon = (await friend.cookies()).find((c) => c.name === "mozart_anon");
  expect(anon?.httpOnly).toBe(true);
  expect(await trackRow(theirSlug)).toMatchObject({ owner: null, anon: anon!.value });

  // 4. A second make asks them to sign in to make another — no Generating screen — and the API refuses.
  await page.getByRole("button", { name: "Cover", exact: true }).click();
  const more = page.getByRole("dialog", { name: "Sign in to make another cover" });
  await expect(more.getByText(MORE_COPY)).toBeVisible();
  await expect(page.getByText("Making your track…")).toHaveCount(0);
  await more.getByRole("button", { name: "Close" }).click();
  const derekTrack = await trackRow(derekSlug);
  const forced = await friend.request.post("/api/generate", { data: { mode: "cover", sourceTrackId: derekTrack!.id, singerId: "dua-lipa" } });
  expect(forced.status()).toBe(403);
  expect(await forced.json()).toEqual({ error: "anon_limit", sendTo: "Derek" });

  // 5. Send to Derek → Continue with Spotify → back on their track: creator, sheet open, toast.
  await page.getByRole("button", { name: "Send to Derek" }).click();
  const sheet = page.getByRole("dialog", { name: "Send to Derek" });
  await expect(sheet.getByText("Sign in with Spotify to save your remix and send it back.")).toBeVisible();
  await sheet.getByRole("link", { name: "Continue with Spotify" }).click();
  await expect(page).toHaveURL(`/track/${theirSlug}`);
  await expect(page.getByRole("dialog", { name: "Share this track" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Signed in · saved to your library" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Close player" })).toBeVisible();
  expect((await (await friend.request.get("/api/me")).json()).user.firstName).toBe("Candice");

  // 6. Close → 06-08 → Close player → their Library has it ("Today"). Claimed in the DB; cookie gone.
  //    (Not asserted as first: another test may make a track as Candice in parallel.)
  await page.getByRole("dialog", { name: "Share this track" }).getByRole("button", { name: "Close" }).click();
  await page.getByRole("link", { name: "Close player" }).click();
  await expect(page).toHaveURL("/library");
  await expect(page.locator(`a[href="/track/${theirSlug}"]`)).toHaveAttribute("aria-label", /^Latch × Electronic .*Today$/);
  expect(await trackRow(theirSlug)).toMatchObject({ owner: CANDICE.id, anon: null });
  expect((await friend.cookies()).some((c) => c.name === "mozart_anon")).toBe(false);

  // 7. Derek's library doesn't have it; Derek sees Candice's track as a recipient.
  await derekPage.goto("/library");
  await expect(derekPage.locator(`a[href="/track/${theirSlug}"]`)).toHaveCount(0);
  await derekPage.goto(`/track/${theirSlug}`);
  await expect(derekPage.getByText("Sent by Candice")).toBeVisible();

  // 8. Refreshing their track: no toast, no sheet.
  await page.goto(`/track/${theirSlug}`);
  await expect(page.getByText("Signed in · saved to your library")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await derek.close();
  await friend.close();
});

test.describe("edge cases", () => {
  test("the maker reopening their result later still gets it; another browser sees 'A friend' and can make its own", async ({ browser }) => {
    const friend = await stranger(browser);
    const page = await friend.newPage();
    await page.goto(`/track/${DEREK_LATCH.slug}`);
    const theirSlug = await remixFromPlayer(page, "Jazz");

    await page.goto(`/track/${theirSlug}`);
    await expect(page.getByRole("button", { name: "Send to Derek" })).toBeVisible();
    await expect(page.getByText("You", { exact: true })).toBeVisible();

    const other = await stranger(browser);
    const otherPage = await other.newPage();
    await otherPage.goto(`/track/${theirSlug}`);
    await expect(otherPage.getByText("Sent by a friend")).toBeVisible();
    await expect(otherPage.getByText("A friend", { exact: true })).toBeVisible();
    await expect(otherPage.getByRole("button", { name: /^Send to/ })).toHaveCount(0);
    // Their own one make works (a link, not the sheet).
    const otherSlug = await remixFromPlayer(otherPage, "Disco");
    await expect(otherPage.getByRole("button", { name: "Send to Derek" })).toBeVisible();
    expect(otherSlug).not.toBe(theirSlug);
    await friend.close();
    await other.close();
  });

  test("a signed-in user opening an anonymous track gets the recipient view and makes as themselves", async ({ browser }) => {
    const friend = await stranger(browser);
    const fp = await friend.newPage();
    await fp.goto(`/track/${DEREK_LATCH.slug}`);
    const anonSlug = await remixFromPlayer(fp, "Metal");

    // Candice, so Derek's library (checked by generate.spec in parallel) isn't touched.
    const candice = await signedIn(browser, "Candice");
    const page = await candice.newPage();
    await page.goto(`/track/${anonSlug}`);
    await expect(page.getByText("Sent by a friend")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save to your library (sign up)" })).toHaveCount(0);
    const made = await remixFromPlayer(page, "Country");
    expect(await trackRow(made)).toMatchObject({ owner: CANDICE.id, anon: null });
    await friend.close();
    await candice.close();
  });

  test("after their make, 'Sign in to make another …' (tile, step 2, stale page's 403) returns to that mode's step 2, claimed", async ({ browser }) => {
    const friend = await stranger(browser);
    // Opened before the make, so this page still thinks they have one left.
    const stale = await friend.newPage();
    await stale.goto(`/track/${DEREK_LATCH.slug}/rewrite`);
    const page = await friend.newPage();
    await page.goto(`/track/${DEREK_LATCH.slug}`);
    const theirSlug = await remixFromPlayer(page, "Classical");

    // The server's 403 opens the same sheet, for the mode on screen.
    await stale.getByRole("radio", { name: "Heartbreak" }).click();
    await stale.getByRole("button", { name: "Generate rewrite" }).click();
    const staleSheet = stale.getByRole("dialog", { name: "Sign in to make another rewrite" });
    await expect(staleSheet.getByText(MORE_COPY)).toBeVisible();
    await stale.close();

    // Generate on a step 2 after the make.
    await page.goto(`/track/${theirSlug}/vibe`);
    await page.getByRole("textbox").fill("slower");
    await page.getByRole("button", { name: "Generate song" }).click();
    await expect(page.getByRole("dialog", { name: "Sign in to make another version" })).toBeVisible();

    // The Cover tile on their track → sign in → that track's Cover step 2, with the toast, claimed.
    await page.goto(`/track/${theirSlug}`);
    await page.getByRole("button", { name: "Cover", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Sign in to make another cover" });
    await expect(sheet.getByText(MORE_COPY)).toBeVisible();
    await expect(sheet.getByText(/Derek/)).toHaveCount(0);
    await sheet.getByRole("link", { name: "Continue with Spotify" }).click();
    await expect(page).toHaveURL(`/track/${theirSlug}/cover`); // ?saved=1 dropped once read
    await expect(page.getByRole("status").filter({ hasText: "Signed in · saved to your library" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Generate cover" })).toBeVisible();
    expect((await (await friend.request.get("/api/me")).json()).user.firstName).toBe("Candice");
    expect(await trackRow(theirSlug)).toMatchObject({ owner: CANDICE.id, anon: null });
    expect((await friend.cookies()).some((c) => c.name === "mozart_anon")).toBe(false);

    // Signed in now: no sheet, and a refresh shows no toast.
    await page.reload();
    await expect(page.getByText("Signed in · saved to your library")).toHaveCount(0);
    await page.getByRole("radio").first().click();
    await page.getByRole("button", { name: "Generate cover" }).click();
    await page.waitForURL(/\/track\/[0-9a-z]{10}$/, { timeout: 15_000 });
    expect(await trackRow(slugOf(page))).toMatchObject({ owner: CANDICE.id, anon: null });
    await friend.close();
  });

  test("signing in from 05-01 without making anything claims nothing: Candice on Derek's track, no toast, no prompts", async ({ browser }) => {
    const friend = await stranger(browser);
    const page = await friend.newPage();
    await page.goto(`/track/${DEREK_LATCH.slug}`);
    await page.getByRole("button", { name: "Save to your library (sign up)" }).click();
    const sheet = page.getByRole("dialog", { name: "Send to Derek" });
    await expect(sheet.getByText("Sign in with Spotify to make your own version and send it to Derek.")).toBeVisible();
    await sheet.getByRole("link", { name: "Continue with Spotify" }).click();
    await expect(page).toHaveURL(`/track/${DEREK_LATCH.slug}`);
    expect((await (await friend.request.get("/api/me")).json()).user.firstName).toBe("Candice");
    await expect(page.getByText("Signed in · saved to your library")).toHaveCount(0);
    await expect(page.getByText("Sent by Derek")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save to your library (sign up)" })).toHaveCount(0);
    await friend.close();
  });

  test("replaying the sign-in claims once; a tampered cookie claims nothing", async ({ browser }) => {
    const friend = await stranger(browser);
    const page = await friend.newPage();
    await page.goto(`/track/${DEREK_LATCH.slug}`);
    const theirSlug = await remixFromPlayer(page, "Afrobeats");
    const anonId = (await friend.cookies()).find((c) => c.name === "mozart_anon")!.value;
    // "Log in" (Derek) also finishes in completeSignIn (the Spotify route goes via Spotify).
    const login = `/auth/dummy?returnTo=${encodeURIComponent(`/track/${theirSlug}?share=1`)}`;

    const first = await friend.request.post(login, { maxRedirects: 0 });
    expect(first.headers()["location"]).toBe(`/track/${theirSlug}?share=1&saved=1`);
    // Replay with the same (now cleared) cookie value: nothing more to claim.
    const replay = await browser.newContext();
    await replay.addCookies([{ name: "mozart_anon", value: anonId, url: BASE_URL }]);
    const again = await replay.request.post(login, { maxRedirects: 0 });
    expect(again.headers()["location"]).toBe(`/track/${theirSlug}?share=1`);
    expect(await trackRow(theirSlug)).toMatchObject({ owner: DEREK.id, anon: null });

    // A cookie that isn't a UUID is ignored entirely.
    const tampered = await browser.newContext();
    await tampered.addCookies([{ name: "mozart_anon", value: "not-a-uuid--drop-table-tracks", url: BASE_URL }]);
    const t = await tampered.request.post(login, { maxRedirects: 0 });
    expect(t.headers()["location"]).toBe(`/track/${theirSlug}?share=1`);
    await friend.close();
    await replay.close();
    await tampered.close();
  });

  test("signed out: a make with no source track is 401", async ({ request }) => {
    const res = await request.post("/api/generate", { data: { mode: "remix", sourceSongId: "mock-track-01", genreId: "bollywood" } });
    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({ error: "signin_required" });
  });

  test("an anonymous track's preview says 'A friend' and never contains the cookie", async ({ browser }) => {
    const friend = await stranger(browser);
    const page = await friend.newPage();
    await page.goto(`/track/${DEREK_LATCH.slug}`);
    const theirSlug = await remixFromPlayer(page, "K-pop");
    const anonId = (await friend.cookies()).find((c) => c.name === "mozart_anon")!.value;

    // As a crawler (no cookies) …
    const crawler = await browser.newContext();
    const html = await (await crawler.request.get(`/track/${theirSlug}`, { headers: { "user-agent": "WhatsApp/2.23.20.0 A" } })).text();
    expect(html).toContain("Latch × K-pop · A friend on Mozart");
    expect(html).not.toContain(anonId);
    // … and even as the maker: the cookie value never reaches the page.
    const own = await (await friend.request.get(`/track/${theirSlug}`)).text();
    expect(own).not.toContain(anonId);
    await friend.close();
    await crawler.close();
  });

  test("signed out, /create and /library still redirect to /", async ({ page }) => {
    for (const url of ["/create", "/create/cover", "/library"]) {
      await page.goto(url);
      await expect(page, url).toHaveURL("/");
    }
  });
});
