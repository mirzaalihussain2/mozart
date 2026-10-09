// pnpm shots [id ...] — capture screens at 390 × 844 @3× into .shots/{id}.png.
// Reuses a dev server on 127.0.0.1:3000 or starts one for the run.
import { spawn, type ChildProcess } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { SHOTS } from "./shots.config";

const BASE_URL = "http://127.0.0.1:3000";
const OUT_DIR = path.resolve(".shots");

async function isUp(): Promise<boolean> {
  try {
    await fetch(BASE_URL, { redirect: "manual" });
    return true;
  } catch {
    return false;
  }
}

async function ensureServer(): Promise<ChildProcess | null> {
  if (await isUp()) return null;
  console.log("Starting dev server…");
  const child = spawn("pnpm", ["dev"], { stdio: "ignore", detached: true });
  for (let i = 0; i < 120; i++) {
    if (await isUp()) return child;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Dev server did not start on " + BASE_URL);
}

async function main() {
  const filter = process.argv.slice(2);
  const shots = filter.length ? SHOTS.filter((s) => filter.includes(s.id)) : SHOTS;
  if (!shots.length) throw new Error(`No shots match: ${filter.join(", ")}`);

  await mkdir(OUT_DIR, { recursive: true });
  const server = await ensureServer();
  const browser = await chromium.launch();

  try {
    for (const shot of shots) {
      const context = await browser.newContext({
        baseURL: BASE_URL,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
      });
      if (shot.auth === "dummy") {
        const res = await context.request.post("/auth/dummy", { maxRedirects: 0 });
        if (res.status() !== 303) throw new Error(`Dummy login failed: ${res.status()}`);
      }
      const page = await context.newPage();
      await page.goto(shot.route, { waitUntil: "networkidle" });
      // Hide the Next.js dev indicator so it doesn't show up in captures.
      await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
      await page.evaluate(() => document.fonts.ready);
      const file = path.join(OUT_DIR, `${shot.id}.png`);
      await page.screenshot({ path: file });
      console.log(`${shot.id}  ${shot.route}  →  ${path.relative(process.cwd(), file)}`);
      await context.close();
    }
  } finally {
    await browser.close();
    if (server?.pid) process.kill(-server.pid);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
