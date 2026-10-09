import { expect, test, type Page } from "@playwright/test";
import { DEREK_LATCH, DEREK_POP_PUNK } from "./helpers/personas";

// Milestone 6: keep listening while browsing. Navigation stays client-side
// (a full reload clears playback, by design).

const audio = (page: Page) =>
  page.evaluate(() => {
    const a = document.querySelector("audio")!;
    return { paused: a.paused, time: a.currentTime, src: a.getAttribute("src") ?? "" };
  });
const mini = (page: Page) => page.getByRole("link", { name: /^Now playing: / });
const MINI_POP_PUNK = `Now playing: ${DEREK_POP_PUNK.title} by Derek. Open player`;

async function playThenMinimise(page: Page) {
  await page.goto("/library");
  await page.getByRole("link", { name: new RegExp(`^${DEREK_POP_PUNK.title.replace("?", "\\?")} REMIX`) }).click();
  await expect(page).toHaveURL(`/track/${DEREK_POP_PUNK.slug}`);
  await page.getByRole("button", { name: "Play" }).click();
  await expect.poll(async () => (await audio(page)).paused).toBe(false);
  await page.getByRole("link", { name: "Minimise player" }).click();
  await expect(page).toHaveURL("/library");
}

test.describe("signed in as Derek", () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post("/auth/dummy");
  });

  test("Minimise → Library with the mini player, outlined row, still playing; tabs keep it (07-02, 01-03)", async ({ page }) => {
    await playThenMinimise(page);
    await expect(page.getByRole("link", { name: MINI_POP_PUNK })).toBeVisible();
    await expect(page.locator('a[aria-current="true"]')).toHaveAttribute("href", `/track/${DEREK_POP_PUNK.slug}`);
    const t = (await audio(page)).time;
    await expect.poll(async () => (await audio(page)).time).toBeGreaterThan(t + 0.3);
    expect((await audio(page)).paused).toBe(false);

    await page.getByRole("link", { name: "Create", exact: true }).click();
    await expect(page).toHaveURL("/create");
    await expect(page.getByRole("link", { name: MINI_POP_PUNK })).toBeVisible();
    expect((await audio(page)).paused).toBe(false);

    await page.getByRole("link", { name: "Library", exact: true }).click();
    await expect(page).toHaveURL("/library");
    await expect(page.getByRole("link", { name: MINI_POP_PUNK })).toBeVisible();
    expect((await audio(page)).paused).toBe(false);
  });

  test("the mini player's pause and play control the one <audio>", async ({ page }) => {
    await playThenMinimise(page);
    await page.getByRole("button", { name: "Pause" }).click();
    await expect.poll(async () => (await audio(page)).paused).toBe(true);
    await page.getByRole("button", { name: "Play" }).click();
    await expect.poll(async () => (await audio(page)).paused).toBe(false);
  });

  test("tapping the mini player reopens the player at the same point, no restart", async ({ page }) => {
    await playThenMinimise(page);
    // Poll rather than sleep: under load the MP3 can still be buffering.
    await expect.poll(async () => (await audio(page)).time).toBeGreaterThan(0.8);
    const before = await audio(page);
    await mini(page).click();
    await expect(page).toHaveURL(`/track/${DEREK_POP_PUNK.slug}`);
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
    const after = await audio(page);
    expect(after.src).toBe(before.src);
    expect(after.paused).toBe(false);
    expect(after.time).toBeGreaterThanOrEqual(before.time);
  });

  test("a step screen pauses (still loaded); back on Create the mini player resumes it", async ({ page }) => {
    await playThenMinimise(page);
    await mini(page).click();
    await page.getByRole("link", { name: "Remix", exact: true }).click();
    await expect(page).toHaveURL(`/track/${DEREK_POP_PUNK.slug}/remix`);
    await expect.poll(async () => (await audio(page)).paused).toBe(true);

    await page.getByRole("link", { name: "Back", exact: true }).click();
    await page.getByRole("link", { name: "Minimise player" }).click();
    await page.getByRole("link", { name: "Create", exact: true }).click();
    await expect(page).toHaveURL("/create");
    await expect(mini(page)).toBeVisible();
    expect((await audio(page)).paused).toBe(true);
    await page.getByRole("button", { name: "Play" }).click();
    await expect.poll(async () => (await audio(page)).paused).toBe(false);
  });

  test("saved ✓ shows for Derek's own track", async ({ page }) => {
    await playThenMinimise(page);
    await expect(page.getByRole("img", { name: "Saved to your library" })).toBeVisible();
  });

  test("Close player (after signing in) stops the music: Library with no mini player (07-01)", async ({ page }) => {
    await page.goto(`/track/${DEREK_LATCH.slug}?saved=1`);
    await page.getByRole("button", { name: "Play" }).click();
    await expect.poll(async () => (await audio(page)).paused).toBe(false);
    await page.getByRole("link", { name: "Close player" }).click();
    await expect(page).toHaveURL("/library");
    await expect(mini(page)).toHaveCount(0);
    const a = await audio(page);
    expect(a.paused).toBe(true);
    expect(a.src).toBe("");
  });

  test("Log out stops the music; signing back in shows no mini player", async ({ page }) => {
    await playThenMinimise(page);
    await page.getByRole("link", { name: "Create", exact: true }).click();
    // The Library has a Profile button too: open the menu on /create, not before it.
    await expect(page).toHaveURL("/create");
    await page.getByRole("button", { name: "Profile" }).click();
    await page.getByRole("menuitem", { name: "Log out" }).click();
    await expect(page).toHaveURL("/");
    expect((await audio(page)).paused).toBe(true);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL("/create");
    await expect(mini(page)).toHaveCount(0);
  });
});

test("Candice playing Derek's track: mini player without saved ✓", async ({ page }) => {
  // The Spotify fallback (the fake Spotify refuses by default) from Derek's track is Candice.
  await page.goto(`/auth/spotify/login?returnTo=/track/${DEREK_LATCH.slug}`);
  await expect(page).toHaveURL(`/track/${DEREK_LATCH.slug}`);
  await page.getByRole("button", { name: "Play" }).click();
  await expect.poll(async () => (await audio(page)).paused).toBe(false);
  // The recipient player has no chevron; Mozart → / → (signed in) /create.
  await page.getByRole("link", { name: "Mozart" }).click();
  await expect(page).toHaveURL("/create");
  await expect(page.getByRole("link", { name: `Now playing: ${DEREK_LATCH.title} by Derek. Open player` })).toBeVisible();
  await expect(page.getByRole("img", { name: "Saved to your library" })).toHaveCount(0);
});

test("a shared link opened signed out still doesn't autoplay", async ({ page }) => {
  await page.goto(`/track/${DEREK_LATCH.slug}`);
  await page.waitForTimeout(800);
  const a = await audio(page);
  expect(a.paused).toBe(true);
  expect(a.src).toBe("");
});
