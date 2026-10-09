import { expect, test, type Page } from "@playwright/test";
import { shareMessage } from "../../lib/share-message";
import { BASE_URL } from "../../playwright.config";

// Milestone 4: Copy link, WhatsApp, link previews and the shared-link
// recipient view (03-06, 05-07, 06-07).

const TRACK = "derek-latch-weeknd"; // Derek's newest starter (lib/config/personas.ts)
const TITLE = "Latch × The Weeknd";
const URL_ = `${BASE_URL}/track/${TRACK}`;
const WHATSAPP_UA = "WhatsApp/2.23.20.0 A";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

async function openShareSheet(page: Page, path: string) {
  await page.goto(path);
  await page.getByRole("button", { name: "Share", exact: true }).click();
  return page.getByRole("dialog", { name: "Share this track" });
}

async function expectWhatsApp(page: Page) {
  const link = page.getByRole("link", { name: "WhatsApp" });
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  const href = (await link.getAttribute("href"))!;
  expect(href.startsWith("https://wa.me/?text=")).toBe(true);
  expect(new URL(href).searchParams.get("text")).toBe(shareMessage(TITLE, URL_));
}

test.describe("signed in as Derek", () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post("/auth/dummy");
  });

  test("Copy link copies the clean track URL and confirms it (03-06)", async ({ page }) => {
    const sheet = await openShareSheet(page, `/track/${TRACK}`);
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: /Copy link/ }).click();
    await expect(sheet.getByText("Copied ✓")).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(URL_);
    await expect(page.locator("[aria-live=polite]")).toHaveText(/Link copied/);
    await expect(sheet.getByText("Copied ✓")).toHaveCount(0, { timeout: 4000 });
  });

  test("if copying fails, the link is shown selected to copy by hand", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("denied")) } });
      document.execCommand = () => false;
    });
    const sheet = await openShareSheet(page, `/track/${TRACK}`);
    await sheet.getByRole("button", { name: /Copy link/ }).click();
    const field = sheet.getByRole("textbox", { name: "Copy this link:" });
    await expect(field).toHaveValue(URL_);
    await expect(field).toBeFocused();
    expect(await field.evaluate((el: HTMLInputElement) => el.value.slice(el.selectionStart!, el.selectionEnd!))).toBe(URL_);
    await expect(sheet.getByText("Copied ✓")).toHaveCount(0);
  });

  test("WhatsApp opens wa.me with the agreed message in a new tab (03-06)", async ({ page }) => {
    await openShareSheet(page, `/track/${TRACK}`);
    await expectWhatsApp(page);
  });

  test("the recipient preview's sheet shares the same clean URL (05-07 via ?view=recipient)", async ({ page }) => {
    await page.goto(`/track/${TRACK}?view=recipient`);
    await expect(page.getByText("Sent by Derek")).toBeVisible();
    // The recipient player has no Share icon; ?share=1 opens the sheet.
    await page.goto(`/track/${TRACK}?view=recipient&share=1`);
    const sheet = page.getByRole("dialog", { name: "Share this track" });
    await expect(sheet.getByRole("link", { name: /Open as recipient/ })).toHaveCount(0);
    await sheet.getByRole("button", { name: /Copy link/ }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(URL_);
    await expectWhatsApp(page);
  });
});

test.describe("signed out", () => {
  test("a shared link opens the recipient player, no autoplay, and shares the same URL", async ({ page }) => {
    const res = await page.goto(`/track/${TRACK}`);
    expect(res?.status()).toBe(200);
    await expect(page.getByText("Sent by Derek")).toBeVisible();
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => document.querySelector("audio")!.paused)).toBe(true);

    await page.goto(`/track/${TRACK}?share=1`);
    const sheet = page.getByRole("dialog", { name: "Share this track" });
    await sheet.getByRole("button", { name: /Copy link/ }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(URL_);
    await expectWhatsApp(page);

    // Audio is public.
    const audio = await page.request.get("/audio/bollywood-strings.mp3", { headers: { Range: "bytes=0-1" } });
    expect([200, 206]).toContain(audio.status());
  });
});

test.describe("link previews", () => {
  const meta = (html: string, key: string) =>
    html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`))?.[1]?.replace(/&amp;/g, "&");

  test("crawlers get Open Graph and Twitter tags in the initial <head>, without cookies", async ({ request }) => {
    const res = await request.get(`/track/${TRACK}`, { headers: { "user-agent": WHATSAPP_UA } });
    expect(res.status()).toBe(200);
    const head = (await res.text()).split("</head>")[0];
    expect(meta(head, "og:title")).toBe(`${TITLE} · Derek on Mozart`);
    expect(meta(head, "og:description")).toBe("Listen, then make your own version on Mozart.");
    expect(meta(head, "og:url")).toBe(URL_);
    expect(meta(head, "og:type")).toBe("music.song");
    expect(meta(head, "twitter:card")).toBe("summary_large_image");
    expect(meta(head, "robots")).toBe("noindex, nofollow");
    expect(meta(head, "og:image")).toMatch(new RegExp(`^https?://[^/]+/track/${TRACK}/opengraph-image`));

    // The image: absolute, public PNG, 1200 × 630, under 300 KB.
    const img = await request.get(meta(head, "og:image")!);
    expect(img.status()).toBe(200);
    expect(img.headers()["content-type"]).toBe("image/png");
    const png = await img.body();
    expect(png.length).toBeLessThan(300 * 1024);
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
  });

  test("Facebook's crawler gets the same tags", async ({ request }) => {
    const head = (await (await request.get(`/track/${TRACK}`, { headers: { "user-agent": "facebookexternalhit/1.1" } })).text()).split("</head>")[0];
    expect(meta(head, "og:title")).toBe(`${TITLE} · Derek on Mozart`);
    expect(meta(head, "og:image")).toBeTruthy();
  });

  test("a missing slug is a 404 with generic Mozart metadata", async ({ request }) => {
    const res = await request.get("/track/no-such-track", { headers: { "user-agent": WHATSAPP_UA } });
    expect(res.status()).toBe(404);
    const head = (await res.text()).split("</head>")[0];
    expect(meta(head, "og:title")).toBe("Mozart");
    expect(head).not.toContain("Derek on Mozart");
  });

  test("the home page has a default preview image", async ({ request }) => {
    const head = (await (await request.get("/", { headers: { "user-agent": WHATSAPP_UA } })).text()).split("</head>")[0];
    const img = await request.get(meta(head, "og:image")!);
    expect(img.headers()["content-type"]).toBe("image/png");
  });
});
