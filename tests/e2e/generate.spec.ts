import { expect, test, type Page } from "@playwright/test";
import { AUDIO_CATALOGUE } from "../../lib/config/audio-catalogue";
import { closeDb, deleteTracks } from "./helpers/db";

// Milestone 3: Generate makes a real track (named by the rule, saved to the
// library, playing catalogue audio), and the player drives one <audio>.

const CATALOGUE_FILES = AUDIO_CATALOGUE.map((a) => a.file);

// In order, one worker: each test checks its new track is first in the Library.
test.describe.configure({ mode: "default" });
const created: string[] = [];

/** Records every slug POST /api/generate returns on this page, for cleanup. */
function recordCreated(page: Page) {
  page.on("response", async (res) => {
    if (res.url().endsWith("/api/generate") && res.status() === 201) {
      const body = (await res.json().catch(() => null)) as { track?: { slug: string } } | null;
      if (body?.track) created.push(body.track.slug);
    }
  });
}

test.afterEach(async () => {
  await deleteTracks(created.splice(0));
});
test.afterAll(async () => {
  await closeDb();
});

const audioState = (page: Page) =>
  page.evaluate(() => {
    const a = document.querySelector("audio")!;
    return { src: a.getAttribute("src") ?? "", paused: a.paused, time: a.currentTime };
  });

/** After Generate: on a new /track/{slug}, with this title and a catalogue file; first in the Library. */
async function expectNewTrack(page: Page, title: string) {
  await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:3000\/track\/[0-9a-z]{10}$/, { timeout: 15_000 });
  const slug = new URL(page.url()).pathname.split("/")[2];
  expect(slug).not.toBe("cruel-bolly");
  expect(created).toContain(slug);
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  // ?autoplay=1 loads it straight away (playing unless the browser blocks it).
  await expect.poll(async () => (await audioState(page)).src).toMatch(/^\/audio\/.+\.mp3$/);
  expect(CATALOGUE_FILES).toContain((await audioState(page)).src);

  await page.goto("/library");
  const first = page.locator('a[href^="/track/"]').first();
  await expect(first).toHaveAttribute("href", `/track/${slug}`);
  await expect(first).toHaveAttribute("aria-label", new RegExp(`^${escape(title)} .*Today$`));
  return slug;
}
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test.describe("signed in as Ali", () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post("/auth/dummy");
    recordCreated(page);
  });

  test("Remix makes Cruel Summer × Bollywood and the Generating screen stays ≥ 3.5 s (02-02 → 03-01 → 03-05)", async ({ page }) => {
    await page.goto("/create/remix/mock-track-01");
    await page.getByRole("radio", { name: "Bollywood" }).click();
    const t0 = Date.now();
    await page.getByRole("button", { name: "Generate remix" }).click();
    await expect(page.getByText("Making your track…")).toBeVisible();
    await page.waitForURL(/\/track\/[0-9a-z]{10}/, { timeout: 15_000 });
    expect(Date.now() - t0).toBeGreaterThanOrEqual(3500);
    await expectNewTrack(page, "Cruel Summer × Bollywood");
  });

  test("Cover makes In Too Deep × Arijit Singh (02-04 → 03-02)", async ({ page }) => {
    await page.goto("/create/cover");
    await page.getByRole("link", { name: "In Too Deep by Sum 41" }).click();
    await page.getByRole("radio", { name: "Arijit Singh" }).click();
    await page.getByRole("button", { name: "Generate cover" }).click();
    await expectNewTrack(page, "In Too Deep × Arijit Singh");
  });

  test("Rewrite makes Payphone × Moving to London (02-06 → 03-03)", async ({ page }) => {
    await page.goto("/create/rewrite");
    await page.getByRole("link", { name: "Payphone by Maroon 5" }).click();
    await page.getByRole("radio", { name: "Moving to London" }).click();
    await page.getByRole("button", { name: "Generate rewrite" }).click();
    await expectNewTrack(page, "Payphone × Moving to London");
  });

  test("Something new from free text is named after it (02-08 → 03-04)", async ({ page }) => {
    await page.goto("/create/new");
    await page.getByLabel("Describe your song").fill("A sad garage song about the night bus home");
    await page.getByRole("button", { name: "Generate song" }).click();
    await expectNewTrack(page, "A sad garage song");
  });

  test("Something new with an empty box is named after the idea on screen (02-07)", async ({ page }) => {
    await page.goto("/create/new");
    await page.getByRole("button", { name: "Generate song" }).click();
    await expectNewTrack(page, "Euphoric electronic pop");
  });

  test("Remix from cruel-electro keeps the root song: Cruel Summer × Lo-fi (04-01)", async ({ page }) => {
    await page.goto("/track/cruel-electro");
    await page.getByRole("link", { name: "Remix", exact: true }).click();
    await page.getByRole("radio", { name: "Lo-fi" }).click();
    await page.getByRole("button", { name: "Generate remix" }).click();
    await expectNewTrack(page, "Cruel Summer × Lo-fi");
  });

  test("Vibe from a player names it {root} × {trimmed text} (04-05)", async ({ page }) => {
    await page.goto("/track/cruel-bolly/vibe");
    await page.getByLabel("Describe how to change this song").fill("make it a stripped-back acoustic version for a rainy Sunday");
    await page.getByRole("button", { name: "Generate song" }).click();
    await expectNewTrack(page, "Cruel Summer × Make it a stripped-back");
  });

  test("a double tap on Generate creates one track", async ({ page }) => {
    let posts = 0;
    page.on("request", (r) => {
      if (r.url().endsWith("/api/generate")) posts++;
    });
    await page.goto("/create/remix/mock-track-01");
    await page.getByRole("radio", { name: "Electronic" }).click();
    await page.getByRole("button", { name: "Generate remix" }).dblclick();
    await page.waitForURL(/\/track\/[0-9a-z]{10}/, { timeout: 15_000 });
    expect(posts).toBe(1);
    expect(created).toHaveLength(1);
  });

  test("Back from the new player returns to the step screen, not Generating", async ({ page }) => {
    await page.goto("/create/remix/mock-track-01");
    await page.getByRole("radio", { name: "Jazz" }).click();
    await page.getByRole("button", { name: "Generate remix" }).click();
    await page.waitForURL(/\/track\/[0-9a-z]{10}/, { timeout: 15_000 });
    await page.goBack();
    await expect(page).toHaveURL("/create/remix/mock-track-01");
    await expect(page.getByRole("button", { name: "Generate remix" })).toBeVisible();
  });

  test("player: Play plays, Pause pauses, seeking moves the time (03-05)", async ({ page }) => {
    await page.goto("/track/cruel-bolly");
    await page.getByRole("button", { name: "Play" }).click();
    await expect.poll(async () => (await audioState(page)).paused).toBe(false);
    const t1 = (await audioState(page)).time;
    await expect.poll(async () => (await audioState(page)).time).toBeGreaterThan(t1 + 0.3);
    expect((await audioState(page)).src).toBe("/audio/bollywood-strings.mp3");

    await page.getByRole("button", { name: "Pause" }).click();
    await expect.poll(async () => (await audioState(page)).paused).toBe(true);

    const slider = page.getByRole("slider", { name: "Seek" });
    const before = (await audioState(page)).time;
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(async () => (await audioState(page)).time).toBeGreaterThan(before + 4);

    const box = (await slider.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height / 2);
    await expect.poll(async () => (await audioState(page)).time).toBeGreaterThan(80);
    await expect(slider).toHaveAttribute("aria-valuetext", /^1:3\d of 3:0\d$/);
  });

  test("opening a track directly never autoplays", async ({ page }) => {
    await page.goto("/track/cruel-bolly");
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
    await page.waitForTimeout(1000);
    const a = await audioState(page);
    expect(a.paused).toBe(true);
    expect(a.src).toBe("");
  });

  test("leaving the player pauses audio", async ({ page }) => {
    await page.goto("/track/cruel-bolly");
    await page.getByRole("button", { name: "Play" }).click();
    await expect.poll(async () => (await audioState(page)).paused).toBe(false);
    await page.getByRole("link", { name: "Minimise player" }).click();
    await expect(page).toHaveURL("/library");
    await expect.poll(async () => (await audioState(page)).paused).toBe(true);
  });
});

test.describe("POST /api/generate", () => {
  test("400 for bad input", async ({ request }) => {
    await request.post("/auth/dummy");
    for (const data of [{ mode: "dance" }, { mode: "remix", sourceSongId: "mock-track-01", genreId: "polka" }, { mode: "new", text: "" }]) {
      const res = await request.post("/api/generate", { data });
      expect(res.status(), JSON.stringify(data)).toBe(400);
      expect((await res.json()).error).toBe("bad_request");
    }
  });

  test("401 when signed out", async ({ request }) => {
    const res = await request.post("/api/generate", { data: { mode: "remix", sourceSongId: "mock-track-01", genreId: "bollywood" } });
    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({ error: "signin_required" });
  });
});
