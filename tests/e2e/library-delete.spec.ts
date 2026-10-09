import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { BASE_URL } from "../../playwright.config";
import { closeDb, deleteTracks, trackRow } from "./helpers/db";
import { CANDICE_KILL_BILL, DEREK, songId } from "./helpers/personas";

// The Library ⋯ menu: Share and Delete (no design). Tests delete only tracks
// they made: Derek's starters are shared by every spec running in parallel
// (that a deleted starter returns at the next sign-in is a unit test).

const created: string[] = [];
test.afterEach(async () => {
  await deleteTracks(created.splice(0)); // anything a failed test left behind
});
test.afterAll(async () => {
  await closeDb();
});

/** Makes a Derek track through the API; returns its slug and title. */
async function makeTrack(request: APIRequestContext, genreId: string) {
  const res = await request.post("/api/generate", { data: { mode: "remix", sourceSongId: songId(DEREK, "Holocene"), genreId } });
  expect(res.status()).toBe(201);
  const { track } = (await res.json()) as { track: { slug: string; title: string } };
  created.push(track.slug);
  return track;
}

const row = (page: Page, slug: string) => page.locator(`a[href="/track/${slug}"]`);
const audio = (page: Page) =>
  page.evaluate(() => {
    const a = document.querySelector("audio")!;
    return { paused: a.paused, src: a.getAttribute("src") ?? "" };
  });

test.describe("signed in as Derek", () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post("/auth/dummy");
  });

  test("⋯ → Delete removes the track at once, for good: gone from the Library, its link 404s", async ({ page }) => {
    const track = await makeTrack(page.request, "jazz");
    await page.goto("/library");
    await expect(row(page, track.slug)).toBeVisible();

    await page.getByRole("button", { name: `More options for ${track.title}` }).first().click();
    const sheet = page.getByRole("dialog", { name: track.title });
    await expect(sheet.getByRole("button", { name: /^Share/ })).toBeVisible();
    const del = sheet.getByRole("button", { name: /^Delete/ });
    await expect(del).toHaveCSS("color", "rgb(255, 69, 58)");
    await del.click(); // no confirmation step

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(row(page, track.slug)).toHaveCount(0);
    expect(await trackRow(track.slug)).toBeNull();
    await page.reload();
    await expect(row(page, track.slug)).toHaveCount(0);
    await page.goto(`/track/${track.slug}`);
    await expect(page.getByRole("heading", { name: "Nothing here" })).toBeVisible();
  });

  test("⋯ → Share opens the creator share sheet for that track", async ({ page }) => {
    const track = await makeTrack(page.request, "metal");
    await page.goto("/library");
    await page.getByRole("button", { name: `More options for ${track.title}` }).first().click();
    await page.getByRole("dialog", { name: track.title }).getByRole("button", { name: /^Share/ }).click();
    const share = page.getByRole("dialog", { name: "Share this track" });
    await expect(share.getByRole("button", { name: /Copy link/ })).toHaveAttribute("data-share-url", `${BASE_URL}/track/${track.slug}`);
    await expect(share.getByRole("link", { name: /Open as recipient/ })).toHaveAttribute("href", `/track/${track.slug}?view=recipient`);
    await expect(page.getByRole("dialog", { name: track.title })).toHaveCount(0);
  });

  test("deleting the track that's playing stops it and the mini player goes", async ({ page }) => {
    const track = await makeTrack(page.request, "classical");
    await page.goto(`/track/${track.slug}`);
    await page.getByRole("button", { name: "Play" }).click();
    await expect.poll(async () => (await audio(page)).paused).toBe(false);
    await page.getByRole("link", { name: "Minimise player" }).click();
    await expect(page).toHaveURL("/library");
    await expect(page.getByRole("link", { name: /^Now playing:/ })).toBeVisible();

    await page.getByRole("button", { name: `More options for ${track.title}` }).first().click();
    await page.getByRole("dialog", { name: track.title }).getByRole("button", { name: /^Delete/ }).click();
    await expect(page.getByRole("link", { name: /^Now playing:/ })).toHaveCount(0);
    const a = await audio(page);
    expect(a.paused).toBe(true);
    expect(a.src).toBe("");
  });

  test("the API only deletes your own tracks", async ({ page, browser }) => {
    // Someone else's track: 404, and it's still there.
    const other = await page.request.delete(`/api/tracks/${CANDICE_KILL_BILL.slug}`);
    expect(other.status()).toBe(404);
    expect(await trackRow(CANDICE_KILL_BILL.slug)).not.toBeNull();
    expect((await page.request.delete("/api/tracks/no-such-track")).status()).toBe(404);

    // Signed out: 401, still there.
    const track = await makeTrack(page.request, "disco");
    const stranger = await browser.newContext();
    expect((await stranger.request.delete(`${BASE_URL}/api/tracks/${track.slug}`)).status()).toBe(401);
    await stranger.close();
    expect(await trackRow(track.slug)).not.toBeNull();

    // Another site can't do it with Derek's cookie.
    const forged = await page.request.delete(`/api/tracks/${track.slug}`, { headers: { Origin: "https://evil.example" } });
    expect(forged.status()).toBe(403);
    expect(await trackRow(track.slug)).not.toBeNull();

    // The owner: 204.
    expect((await page.request.delete(`/api/tracks/${track.slug}`)).status()).toBe(204);
    expect(await trackRow(track.slug)).toBeNull();
  });
});

test("signed out, the recipient player has no delete", async ({ page }) => {
  await page.goto(`/track/${CANDICE_KILL_BILL.slug}`);
  await expect(page.getByText("Sent by Candice")).toBeVisible();
  await expect(page.getByRole("button", { name: /Delete|More options/ })).toHaveCount(0);
});
