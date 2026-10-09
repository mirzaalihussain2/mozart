import { expect, test, type Page } from "@playwright/test";

// Milestone 2: navigation per docs/flow-index.md, clicking elements by the
// names the flow index uses. Generation is mocked (Generating ~3.5 s → player).

const signIn = (page: Page) => page.request.post("/auth/dummy");

test.describe("signed in as Ali", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("Create home → Remix → pick a song → genre → Generating → player (01-02, 02-01, 02-02, 03-01, 03-05)", async ({ page }) => {
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

    await expect(page.getByText("Making your track…")).toBeVisible();
    await expect(page.getByText("“Cruel Summer, but make it Bollywood.”")).toBeVisible();
    await expect(page).toHaveURL("/track/cruel-bolly", { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "Cruel Summer × Bollywood" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Saved to your library" })).toBeVisible();
  });

  test("step 2 back links: Back and change song return to step 1", async ({ page }) => {
    await page.goto("/create/cover");
    await page.getByRole("link", { name: "In Too Deep by Sum 41" }).click();
    await page.getByRole("link", { name: "In Too Deep by Sum 41, change song" }).click();
    await expect(page).toHaveURL("/create/cover");
    await page.getByRole("link", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL("/create");
  });

  test("Something new uses the idea on screen when the box is empty (02-07)", async ({ page }) => {
    await page.goto("/create");
    await page.getByRole("link", { name: /^Something new/ }).click();
    await expect(page).toHaveURL("/create/new");
    await expect(page.getByText("Step 1 of 2")).toHaveCount(0);
    await page.getByRole("button", { name: "Generate song" }).click();
    await expect(page.getByText("Making your track…")).toBeVisible();
  });

  test("player: share sheet opens and closes by X, backdrop and Escape (03-05, 03-06)", async ({ page }) => {
    await page.goto("/track/cruel-bolly");
    const sheet = page.getByRole("dialog", { name: "Share this track" });

    await page.getByRole("button", { name: "Share" }).click();
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(sheet).toHaveCount(0);

    await page.getByRole("button", { name: "Share" }).click();
    await page.getByRole("button", { name: "Close share sheet" }).click({ position: { x: 20, y: 20 } });
    await expect(sheet).toHaveCount(0);

    await page.getByRole("button", { name: "Share" }).click();
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
  });

  test("share sheet → Open as recipient shows the recipient player (05-01)", async ({ page }) => {
    await page.goto("/track/cruel-bolly");
    await page.getByRole("button", { name: "Share" }).click();
    await page.getByRole("link", { name: /Open as recipient/ }).click();
    await expect(page).toHaveURL("/track/cruel-bolly?view=recipient");
    await expect(page.getByText("Sent by Ali")).toBeVisible();
  });

  test("player tiles open step 2 with the track picked; back returns to the player (04-01, 04-04)", async ({ page }) => {
    await page.goto("/track/cruel-bolly");
    await page.getByRole("link", { name: "Remix" }).click();
    await expect(page).toHaveURL("/track/cruel-bolly/remix");
    await expect(page.getByText(/Step \d of 2/)).toHaveCount(0);
    await page.getByRole("link", { name: "Cruel Summer × Bollywood Ali, back to the player" }).click();
    await expect(page).toHaveURL("/track/cruel-bolly");

    await page.getByRole("link", { name: "Vibe" }).click();
    await expect(page.getByText("…but your way.")).toBeVisible();
    await page.getByRole("link", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL("/track/cruel-bolly");
  });

  test("Generate from a player returns to that track (04-01 → 03-01 → 03-05)", async ({ page }) => {
    await page.goto("/track/cruel-electro/remix");
    await page.getByRole("radio", { name: "Lo-fi" }).click();
    await page.getByRole("button", { name: "Generate remix" }).click();
    await expect(page.getByText("“Cruel Summer, but make it Lo-fi.”")).toBeVisible();
    await expect(page).toHaveURL("/track/cruel-electro", { timeout: 10_000 });
  });

  test("Library lists Ali's tracks; a row opens the player; Minimise player returns (07-01)", async ({ page }) => {
    await page.goto("/create");
    await page.getByRole("link", { name: "Library" }).click();
    await expect(page).toHaveURL("/library");
    await expect(page.getByText("6 tracks")).toBeVisible();
    await page.getByRole("link", { name: "Cruel Summer × Electronic REMIX Today" }).click();
    await expect(page).toHaveURL("/track/cruel-electro");
    await page.getByRole("link", { name: "Minimise player" }).click();
    await expect(page).toHaveURL("/library");
    await page.getByRole("link", { name: "Create" }).click();
    await expect(page).toHaveURL("/create");
  });
});

test("signed out: a shared track shows the recipient player and the Send to Ali sheet (05-01, 06-06)", async ({ page }) => {
  await page.goto("/track/cruel-bolly");
  await expect(page.getByText("Sent by Ali")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();

  await page.getByRole("button", { name: "Save to your library (sign up)" }).click();
  const sheet = page.getByRole("dialog", { name: "Send to Ali" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("link", { name: "Continue with Spotify" })).toHaveAttribute(
    "href",
    "/auth/spotify/login?returnTo=%2Ftrack%2Fcruel-bolly",
  );
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);

  await page.getByRole("link", { name: "Mozart" }).click();
  await expect(page).toHaveURL("/");
});

test("unknown tracks, modes and songs are 404s", async ({ page }) => {
  await signIn(page);
  for (const url of ["/track/nope", "/track/cruel-bolly/dance", "/create/dance", "/create/remix/nope"]) {
    const res = await page.goto(url);
    expect(res?.status(), url).toBe(404);
  }
});
