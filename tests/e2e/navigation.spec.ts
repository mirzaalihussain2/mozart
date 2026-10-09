import { expect, test, type Page } from "@playwright/test";
import { PROD_CHECK_URL } from "../../playwright.config";
import { SCREEN_LIST } from "../../lib/dev/screen-list";

// Milestone 2: navigation per docs/flow-index.md, clicking elements by the
// names the flow index uses. Generation is mocked (Generating ~3.5 s → player).

const signIn = (page: Page) => page.request.post("/auth/dummy");
const back = (page: Page) => page.getByRole("link", { name: "Back", exact: true });

async function expectGeneratingThenPlayer(page: Page, quote: string, player: string) {
  await expect(page.getByText("Making your track…")).toBeVisible();
  await expect(page.getByText(quote)).toBeVisible();
  await expect(page).toHaveURL(player, { timeout: 10_000 });
  await expect(page.getByRole("button", { name: /^(Play|Pause)$/ })).toBeVisible();
}

test.describe("signed in as Ali", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("Remix: Create home → song → genre → Generating → player (01-02, 02-01, 02-02, 03-01, 03-05)", async ({ page }) => {
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
    await generate.click();
    await expectGeneratingThenPlayer(page, "“Cruel Summer, but make it Bollywood.”", "/track/cruel-bolly");
  });

  test("Cover: song → singer → Generating → player (02-03, 02-04, 03-02)", async ({ page }) => {
    await page.goto("/create");
    await page.getByRole("link", { name: /^Cover/ }).click();
    await page.getByRole("link", { name: "In Too Deep by Sum 41" }).click();
    await page.getByRole("radio", { name: "Arijit Singh" }).click();
    await page.getByRole("button", { name: "Generate cover" }).click();
    await expectGeneratingThenPlayer(page, "“In Too Deep, sung by Arijit Singh.”", "/track/cruel-bolly");
  });

  test("Rewrite: song → theme → Generating → player (02-05, 02-06, 03-03)", async ({ page }) => {
    await page.goto("/create");
    await page.getByRole("link", { name: /^Rewrite/ }).click();
    await page.getByRole("link", { name: "Payphone by Maroon 5" }).click();
    await page.getByRole("radio", { name: "Moving to London" }).click();
    await expect(page.getByText("…but it’s about moving to London.")).toBeVisible();
    await page.getByRole("button", { name: "Generate rewrite" }).click();
    await expectGeneratingThenPlayer(page, "“Payphone, but it’s about moving to London.”", "/track/cruel-bolly");
  });

  test("Something new: type → Generating → player; no step counter (02-07, 02-08, 03-04)", async ({ page }) => {
    await page.goto("/create");
    await page.getByRole("link", { name: /^Something new/ }).click();
    await expect(page).toHaveURL("/create/new");
    await expect(page.getByText(/Step \d of 2/)).toHaveCount(0);
    await page.getByLabel("Describe your song").fill("A sad garage song about the night bus home");
    await page.getByRole("button", { name: "Generate song" }).click();
    await expectGeneratingThenPlayer(page, "“A sad garage song about the night bus home.”", "/track/cruel-bolly");
  });

  test("Something new with an empty box uses the idea on screen", async ({ page }) => {
    await page.goto("/create/new");
    await page.getByRole("button", { name: "Generate song" }).click();
    await expect(page.getByText("Making your track…")).toBeVisible();
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
    await expect(page.getByText("6 tracks")).toBeVisible();
    const titles = await page.locator('a[href^="/track/"]').evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
    expect(titles.map((t) => t?.replace(/ (REMIX )?(Today|Yesterday|\d{1,2} \w{3})$/, ""))).toEqual([
      "Cruel Summer × Bollywood",
      "Cruel Summer × Electronic",
      "In Too Deep × Bollywood",
      "Euphoric electronic pop",
      "Cinematic pop",
      "In Too Deep × Lo-fi",
    ]);

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

  test("Generate from a player returns to that track (04-01 → 03-01 → 03-05)", async ({ page }) => {
    await page.goto("/track/cruel-electro/remix");
    await page.getByRole("radio", { name: "Lo-fi" }).click();
    await page.getByRole("button", { name: "Generate remix" }).click();
    await expectGeneratingThenPlayer(page, "“Cruel Summer, but make it Lo-fi.”", "/track/cruel-electro");
  });

  test("unknown tracks, modes and songs are 404s", async ({ page }) => {
    for (const url of ["/track/nope", "/track/cruel-bolly/dance", "/create/dance", "/create/remix/nope"]) {
      const res = await page.goto(url);
      expect(res?.status(), url).toBe(404);
    }
  });
});

test.describe("signed out", () => {
  test("shared track: recipient → Send to Ali → Continue with Spotify → back with sheet and toast (05-01, 06-06, 06-07)", async ({ page }) => {
    await page.goto("/track/cruel-bolly");
    await expect(page.getByText("Sent by Ali")).toBeVisible();
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();

    await page.getByRole("button", { name: "Save to your library (sign up)" }).click();
    const signup = page.getByRole("dialog", { name: "Send to Ali" });
    await expect(signup).toBeVisible();
    await expect(signup.getByText("Sign in with Spotify to save your remix and send it back.")).toBeVisible();
    await signup.getByRole("link", { name: "Continue with Spotify" }).click();

    // Signed in (Spotify falls back to Ali), back on the track, params cleaned up.
    await expect(page).toHaveURL("/track/cruel-bolly");
    await expect(page.getByRole("dialog", { name: "Share this track" })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Signed in · saved to your library" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Close player" })).toBeVisible();

    await page.getByRole("button", { name: "Close", exact: true }).first().click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText("Signed in · saved to your library")).toHaveCount(0);
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
