import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { SAM_USER } from "../../lib/config/dummy-user";
import { BASE_URL } from "../../playwright.config";
import { closeDb, deleteTracks, trackRow } from "./helpers/db";

// Milestone 5: the core loop. Ali shares → a friend with no account makes one
// version → "Send to Ali" → signs in (as Sam) → lands on their own track,
// claimed into their library, with the share sheet and toast.

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

/** Signed in as Ali (the landing "Log in"), or as Sam (signing in from Ali's track). */
async function signedIn(browser: Browser, as: "Ali" | "Sam" = "Ali") {
  const ctx = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
  recordCreated(ctx);
  await ctx.request.post(as === "Ali" ? "/auth/dummy" : "/auth/dummy?returnTo=/track/cruel-bolly");
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
  // 1. Ali makes a track and copies its link.
  const ali = await signedIn(browser);
  const aliPage = await ali.newPage();
  await aliPage.goto("/create/remix/mock-track-01");
  await aliPage.getByRole("radio", { name: "Bollywood" }).click();
  await aliPage.getByRole("button", { name: "Generate remix" }).click();
  await aliPage.waitForURL(/\/track\/[0-9a-z]{10}$/, { timeout: 15_000 });
  const aliSlug = slugOf(aliPage);
  await aliPage.getByRole("button", { name: "Share", exact: true }).click();
  await aliPage.getByRole("button", { name: /Copy link/ }).click();
  const link = await aliPage.evaluate(() => navigator.clipboard.readText());
  expect(link).toBe(`${BASE_URL}/track/${aliSlug}`);

  // 2. A friend with no account opens it: recipient view, paused; Play plays.
  const friend = await stranger(browser);
  const page = await friend.newPage();
  await page.goto(link);
  await expect(page.getByText("Sent by Ali")).toBeVisible();
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
  await expect(page.getByText("“Ali’s Cruel Summer, but make it Electronic.”")).toBeVisible();
  await expect(page.locator(".bg-remix").filter({ hasText: "Making your track…" })).toBeVisible();
  await page.waitForURL(/\/track\/[0-9a-z]{10}$/, { timeout: 15_000 });
  expect(Date.now() - t0).toBeGreaterThanOrEqual(3500);
  const theirSlug = slugOf(page);
  expect(theirSlug).not.toBe(aliSlug);
  await expect(page.getByRole("heading", { name: "Cruel Summer × Electronic" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send to Ali" })).toBeVisible();
  await expect(page.getByText("You", { exact: true })).toBeVisible();

  // 3. They now have an httpOnly mozart_anon, and the row is unowned with that id.
  const anon = (await friend.cookies()).find((c) => c.name === "mozart_anon");
  expect(anon?.httpOnly).toBe(true);
  expect(await trackRow(theirSlug)).toMatchObject({ owner: null, anon: anon!.value });

  // 4. A second make asks them to sign in — no Generating screen — and the API refuses.
  await page.getByRole("button", { name: "Cover", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Send to Ali" });
  await expect(sheet).toBeVisible();
  await expect(page.getByText("Making your track…")).toHaveCount(0);
  await sheet.getByRole("button", { name: "Close" }).click();
  const aliTrack = await trackRow(aliSlug);
  const forced = await friend.request.post("/api/generate", { data: { mode: "cover", sourceTrackId: aliTrack!.id, singerId: "dua-lipa" } });
  expect(forced.status()).toBe(403);
  expect(await forced.json()).toEqual({ error: "anon_limit", sendTo: "Ali" });

  // 5. Send to Ali → Continue with Spotify → back on their track: creator, sheet open, toast.
  await page.getByRole("button", { name: "Send to Ali" }).click();
  await sheet.getByRole("link", { name: "Continue with Spotify" }).click();
  await expect(page).toHaveURL(`/track/${theirSlug}`);
  await expect(page.getByRole("dialog", { name: "Share this track" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Signed in · saved to your library" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Close player" })).toBeVisible();
  expect((await (await friend.request.get("/api/me")).json()).user.firstName).toBe("Sam");

  // 6. Close → 06-08 → Close player → their Library has it ("Today"). Claimed in the DB; cookie gone.
  //    (Not asserted as first: another test may make a track as Sam in parallel.)
  await page.getByRole("dialog", { name: "Share this track" }).getByRole("button", { name: "Close" }).click();
  await page.getByRole("link", { name: "Close player" }).click();
  await expect(page).toHaveURL("/library");
  await expect(page.locator(`a[href="/track/${theirSlug}"]`)).toHaveAttribute("aria-label", /^Cruel Summer × Electronic .*Today$/);
  expect(await trackRow(theirSlug)).toMatchObject({ owner: SAM_USER.id, anon: null });
  expect((await friend.cookies()).some((c) => c.name === "mozart_anon")).toBe(false);

  // 7. Ali's library doesn't have it; Ali sees Sam's track as a recipient.
  await aliPage.goto("/library");
  await expect(aliPage.locator(`a[href="/track/${theirSlug}"]`)).toHaveCount(0);
  await aliPage.goto(`/track/${theirSlug}`);
  await expect(aliPage.getByText("Sent by Sam")).toBeVisible();

  // 8. Refreshing their track: no toast, no sheet.
  await page.goto(`/track/${theirSlug}`);
  await expect(page.getByText("Signed in · saved to your library")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await ali.close();
  await friend.close();
});

test.describe("edge cases", () => {
  test("the maker reopening their result later still gets it; another browser sees 'A friend' and can make its own", async ({ browser }) => {
    const friend = await stranger(browser);
    const page = await friend.newPage();
    await page.goto("/track/cruel-bolly");
    const theirSlug = await remixFromPlayer(page, "Jazz");

    await page.goto(`/track/${theirSlug}`);
    await expect(page.getByRole("button", { name: "Send to Ali" })).toBeVisible();
    await expect(page.getByText("You", { exact: true })).toBeVisible();

    const other = await stranger(browser);
    const otherPage = await other.newPage();
    await otherPage.goto(`/track/${theirSlug}`);
    await expect(otherPage.getByText("Sent by a friend")).toBeVisible();
    await expect(otherPage.getByText("A friend", { exact: true })).toBeVisible();
    await expect(otherPage.getByRole("button", { name: /^Send to/ })).toHaveCount(0);
    // Their own one make works (a link, not the sheet).
    const otherSlug = await remixFromPlayer(otherPage, "Disco");
    await expect(otherPage.getByRole("button", { name: "Send to Ali" })).toBeVisible();
    expect(otherSlug).not.toBe(theirSlug);
    await friend.close();
    await other.close();
  });

  test("a signed-in user opening an anonymous track gets the recipient view and makes as themselves", async ({ browser }) => {
    const friend = await stranger(browser);
    const fp = await friend.newPage();
    await fp.goto("/track/cruel-bolly");
    const anonSlug = await remixFromPlayer(fp, "Metal");

    // Sam, so Ali's library (checked by generate.spec in parallel) isn't touched.
    const sam = await signedIn(browser, "Sam");
    const page = await sam.newPage();
    await page.goto(`/track/${anonSlug}`);
    await expect(page.getByText("Sent by a friend")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save to your library (sign up)" })).toHaveCount(0);
    const made = await remixFromPlayer(page, "Country");
    expect(await trackRow(made)).toMatchObject({ owner: SAM_USER.id, anon: null });
    await friend.close();
    await sam.close();
  });

  test("signing in from 05-01 without making anything claims nothing: Sam on Ali's track, no toast, no prompts", async ({ browser }) => {
    const friend = await stranger(browser);
    const page = await friend.newPage();
    await page.goto("/track/cruel-bolly");
    await page.getByRole("button", { name: "Save to your library (sign up)" }).click();
    const sheet = page.getByRole("dialog", { name: "Send to Ali" });
    await expect(sheet.getByText("Sign in with Spotify to make your own version and send it to Ali.")).toBeVisible();
    await sheet.getByRole("link", { name: "Continue with Spotify" }).click();
    await expect(page).toHaveURL("/track/cruel-bolly");
    expect((await (await friend.request.get("/api/me")).json()).user.firstName).toBe("Sam");
    await expect(page.getByText("Signed in · saved to your library")).toHaveCount(0);
    await expect(page.getByText("Sent by Ali")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save to your library (sign up)" })).toHaveCount(0);
    await friend.close();
  });

  test("replaying the sign-in claims once; a tampered cookie claims nothing", async ({ browser }) => {
    const friend = await stranger(browser);
    const page = await friend.newPage();
    await page.goto("/track/cruel-bolly");
    const theirSlug = await remixFromPlayer(page, "Afrobeats");
    const anonId = (await friend.cookies()).find((c) => c.name === "mozart_anon")!.value;
    // The dummy sign-in also finishes in completeSignIn (the Spotify route now goes via Spotify).
    const login = `/auth/dummy?returnTo=${encodeURIComponent(`/track/${theirSlug}?share=1`)}`;

    const first = await friend.request.post(login, { maxRedirects: 0 });
    expect(first.headers()["location"]).toBe(`/track/${theirSlug}?share=1&saved=1`);
    // Replay with the same (now cleared) cookie value: nothing more to claim.
    const replay = await browser.newContext();
    await replay.addCookies([{ name: "mozart_anon", value: anonId, url: BASE_URL }]);
    const again = await replay.request.post(login, { maxRedirects: 0 });
    expect(again.headers()["location"]).toBe(`/track/${theirSlug}?share=1`);
    expect(await trackRow(theirSlug)).toMatchObject({ owner: SAM_USER.id, anon: null });

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
    await page.goto("/track/cruel-bolly");
    const theirSlug = await remixFromPlayer(page, "K-pop");
    const anonId = (await friend.cookies()).find((c) => c.name === "mozart_anon")!.value;

    // As a crawler (no cookies) …
    const crawler = await browser.newContext();
    const html = await (await crawler.request.get(`/track/${theirSlug}`, { headers: { "user-agent": "WhatsApp/2.23.20.0 A" } })).text();
    expect(html).toContain("Cruel Summer × K-pop · A friend on Mozart");
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
