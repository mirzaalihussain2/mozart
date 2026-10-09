import { expect, test, type Page } from "@playwright/test";
import { PROD_CHECK_URL } from "../../playwright.config";
import { SCREEN_LIST } from "../../lib/dev/screen-list";

// Navigation per docs/flow-index.md, clicking elements by the names the flow
// index uses. What Generate makes is covered in generate.spec.ts.

const signIn = (page: Page) => page.request.post("/auth/dummy");
// Ali's seeded library, newest first (lib/config/dummy-user.ts).
const SEEDED = ["cruel-bolly", "cruel-electro", "deep-bolly", "euphoric-pop", "cinematic-pop", "deep-lofi"];
const back = (page: Page) => page.getByRole("link", { name: "Back", exact: true });

test.describe("signed in as Ali", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("Remix: Create home → song → genre → Generate enabled (01-02, 02-01, 02-02)", async ({ page }) => {
    await page.goto("/create");
    await page.getByRole("link", { name: /^Remix/ }).click();
    await expect(page).toHaveURL("/create/remix");
    await expect(page.getByText("Step 1 of 2")).toBeVisible();

    await page.getByRole("link", { name: "Cruel Summer by Taylor Swift" }).click();
    await expect(page.getByText("Step 2 of 2")).toBeVisible();
    const generate = page.getByRole("button", { name: "Generate remix" });
    await expect(generate).toBeDisabled();
    await page.getByRole("radio", { name: "Bollywood" }).click();
    await expect(page.getByText("…but make it Bollywood.")).toBeVisible();
    await expect(generate).toBeEnabled();
  });

  test("Cover: song → singer → Generate enabled (02-03, 02-04)", async ({ page }) => {
    await page.goto("/create");
    await page.getByRole("link", { name: /^Cover/ }).click();
    await page.getByRole("link", { name: "In Too Deep by Sum 41" }).click();
    await page.getByRole("radio", { name: "Arijit Singh" }).click();
    await expect(page.getByText("…sung by Arijit Singh.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Generate cover" })).toBeEnabled();
  });

  test("Rewrite: song → theme → Generate enabled (02-05, 02-06)", async ({ page }) => {
    await page.goto("/create");
    await page.getByRole("link", { name: /^Rewrite/ }).click();
    await page.getByRole("link", { name: "Payphone by Maroon 5" }).click();
    await page.getByRole("radio", { name: "Moving to London" }).click();
    await expect(page.getByText("…but it’s about moving to London.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Generate rewrite" })).toBeEnabled();
  });

  test("Something new: no step counter, type a description (02-07, 02-08)", async ({ page }) => {
    await page.goto("/create");
    await page.getByRole("link", { name: /^Something new/ }).click();
    await expect(page).toHaveURL("/create/new");
    await expect(page.getByText(/Step \d of 2/)).toHaveCount(0);
    await page.getByLabel("Describe your song").fill("A sad garage song about the night bus home");
    await expect(page.getByRole("button", { name: "Generate song" })).toBeEnabled();
  });

  test("back links: step 1 → Create home; step 2 Back and change song → step 1", async ({ page }) => {
    await page.goto("/create/rewrite");
    await back(page).click();
    await expect(page).toHaveURL("/create");

    await page.goto("/create/cover");
    await page.getByRole("link", { name: "In Too Deep by Sum 41" }).click();
    await page.getByRole("link", { name: "In Too Deep by Sum 41, change song" }).click();
    await expect(page).toHaveURL("/create/cover");
    await page.getByRole("link", { name: "Kesariya by Arijit Singh" }).click();
    await back(page).click();
    await expect(page).toHaveURL("/create/cover");
  });

  test("Library: 6 tracks newest first, a row opens its player, tabs switch (07-01)", async ({ page }) => {
    await page.goto("/create");
    await page.getByRole("link", { name: "Library" }).click();
    await expect(page).toHaveURL("/library");
    // Seeded tracks in order (generate.spec may add newer ones while running in parallel).
    const rows = page.locator('a[href^="/track/"]');
    const hrefs = await rows.evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    await expect(page.getByText(`${hrefs.length} tracks`)).toBeVisible();
    expect(hrefs.filter((h) => SEEDED.includes(h!.slice(7)))).toEqual(SEEDED.map((s) => `/track/${s}`));

    await page.getByRole("link", { name: "Cruel Summer × Electronic REMIX Today" }).click();
    await expect(page).toHaveURL("/track/cruel-electro");
    await page.getByRole("link", { name: "Minimise player" }).click();
    await expect(page).toHaveURL("/library");
    await page.getByRole("link", { name: "Create" }).click();
    await expect(page).toHaveURL("/create");
    await expect(page.getByRole("link", { name: "Create" })).toHaveAttribute("aria-current", "page");
  });

  test("creator player: Share sheet opens and closes by X, backdrop and Escape (03-05, 03-06)", async ({ page }) => {
    await page.goto("/track/cruel-bolly");
    await expect(page.getByText("Playing from")).toBeVisible();
    const sheet = page.getByRole("dialog", { name: "Share this track" });

    await page.getByRole("button", { name: "Share" }).click();
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("button", { name: /Copy link/ })).toHaveAttribute(
      "data-share-url",
      "http://127.0.0.1:3000/track/cruel-bolly",
    );
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(sheet).toHaveCount(0);

    await page.getByRole("button", { name: "Share" }).click();
    await page.getByRole("button", { name: "Close share sheet" }).click({ position: { x: 20, y: 20 } });
    await expect(sheet).toHaveCount(0);

    await page.getByRole("button", { name: "Share" }).click();
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
  });

  test("play/pause toggles the icon", async ({ page }) => {
    await page.goto("/track/cruel-bolly");
    await page.getByRole("button", { name: "Play" }).click();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  });

  test("share sheet → Open as recipient shows the recipient variant (05-01)", async ({ page }) => {
    await page.goto("/track/cruel-bolly?share=1");
    await page.getByRole("link", { name: /Open as recipient/ }).click();
    await expect(page).toHaveURL("/track/cruel-bolly?view=recipient");
    await expect(page.getByText("Sent by Ali")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save to your library (sign up)" })).toBeVisible();
  });

  for (const mode of ["Remix", "Cover", "Rewrite", "Vibe"]) {
    test(`player tile ${mode} opens step 2 with no step counter; Back returns (04-0x)`, async ({ page }) => {
      await page.goto("/track/cruel-bolly");
      await page.getByRole("link", { name: mode, exact: true }).click();
      await expect(page).toHaveURL(`/track/cruel-bolly/${mode.toLowerCase()}`);
      await expect(page.getByRole("link", { name: /Cruel Summer × Bollywood,? Ali, back to the player/ })).toBeVisible();
      await expect(page.getByText(/Step \d of 2/)).toHaveCount(0);
      await back(page).click();
      await expect(page).toHaveURL("/track/cruel-bolly");
    });
  }

  test("unknown tracks, modes and songs are 404s", async ({ page }) => {
    for (const url of ["/track/nope", "/track/cruel-bolly/dance", "/create/dance", "/create/remix/nope"]) {
      const res = await page.goto(url);
      expect(res?.status(), url).toBe(404);
    }
  });
});

test.describe("signed out", () => {
  test("shared track: recipient view; Save opens the Send to Ali sheet (05-01, 06-06)", async ({ page }) => {
    await page.goto("/track/cruel-bolly");
    await expect(page.getByText("Sent by Ali")).toBeVisible();
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
    await page.getByRole("button", { name: "Save to your library (sign up)" }).click();
    const sheet = page.getByRole("dialog", { name: "Send to Ali" });
    await expect(sheet.getByRole("link", { name: "Continue with Spotify" })).toHaveAttribute(
      "href",
      "/auth/spotify/login?returnTo=%2Ftrack%2Fcruel-bolly",
    );
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    // The full sign-in round trip is in recipient-loop.spec.ts.
  });

  test("the Send to Ali sheet closes back to the player", async ({ page }) => {
    await page.goto("/track/cruel-bolly");
    await page.getByRole("button", { name: "Save to your library (sign up)" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("link", { name: "Mozart" }).click();
    await expect(page).toHaveURL("/");
  });

  test("/create and /library redirect to /", async ({ page }) => {
    for (const url of ["/create", "/library", "/create/remix"]) {
      await page.goto(url);
      await expect(page, url).toHaveURL("/");
    }
  });
});

test("every gallery screen renders, and /dev is hidden when VERCEL_ENV=production", async ({ request }) => {
  for (const { id } of SCREEN_LIST) {
    expect((await request.get(`/dev/screens/${id}`)).status(), id).toBe(200);
  }
  expect((await request.get(`${PROD_CHECK_URL}/dev/screens`)).status()).toBe(404);
  expect((await request.get(`${PROD_CHECK_URL}/dev/screens/01-01`)).status()).toBe(404);
  expect((await request.get(`${PROD_CHECK_URL}/dev/designs/01-01`)).status()).toBe(404);
});
