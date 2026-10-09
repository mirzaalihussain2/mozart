import { expect, test } from "@playwright/test";

// Landing (01-01), dummy login, Spotify fallback, logout,
// protected /create, /api/me, returnTo validation and the 404 page.

test("landing shows the headline and both buttons", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Make music from what you already love." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Connect Spotify to get started" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
});

test("Log in lands on /create as Ali, and Log out returns to /", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/create");
  await expect(page.getByRole("heading", { name: "What do you want to make?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Profile" })).toHaveText("A");

  await page.getByRole("button", { name: "Profile" }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
});

test("Connect Spotify signs in as Ali (silent fallback)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Connect Spotify to get started" }).click();
  await expect(page).toHaveURL("/create");
  await expect(page.getByRole("heading", { name: "What do you want to make?" })).toBeVisible();
});

test("signed-in visitors to / are sent to /create", async ({ page }) => {
  await page.request.post("/auth/dummy");
  await page.goto("/");
  await expect(page).toHaveURL("/create");
});

test("/create redirects to / when signed out", async ({ page }) => {
  await page.goto("/create");
  await expect(page).toHaveURL("/");
});

test("/api/me returns null signed out and Ali signed in", async ({ request }) => {
  expect(await (await request.get("/api/me")).json()).toEqual({ user: null });

  await request.post("/auth/dummy");
  const { user } = await (await request.get("/api/me")).json();
  expect(user).toMatchObject({ firstName: "Ali", displayName: "Ali", avatarUrl: null });
  expect(typeof user.id).toBe("string");
});

test("returnTo is honoured for same-site paths and ignored otherwise", async ({ request }) => {
  const location = async (url: string, method: "get" | "post") =>
    (await request[method](url, { maxRedirects: 0 })).headers()["location"];

  expect(await location("/auth/dummy?returnTo=/track/cruel-bolly", "post")).toBe("/track/cruel-bolly");
  expect(await location("/auth/dummy?returnTo=//evil.com", "post")).toBe("/create");
  // Spotify sign-in goes via (fake) Spotify and back; with no scenario cookie it
  // falls back to the dummy persona — the bad returnTo still ends on /create.
  for (const bad of ["//evil.com", "https://evil.com", "/%5Cevil.com"]) {
    const res = await request.get(`/auth/spotify/login?returnTo=${bad}`);
    expect(new URL(res.url()).pathname, bad).toBe("/create");
  }
});

test("a 404 links back to / when signed out and /create when signed in", async ({ page }) => {
  await page.goto("/track/no-such-track");
  await expect(page.getByRole("heading", { name: "Nothing here" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to Mozart" })).toHaveAttribute("href", "/");

  await page.request.post("/auth/dummy");
  await page.goto("/no-such-page");
  await expect(page.getByRole("link", { name: "Back to Mozart" })).toHaveAttribute("href", "/create");
  await page.getByRole("link", { name: "Back to Mozart" }).click();
  await expect(page).toHaveURL("/create");
});
