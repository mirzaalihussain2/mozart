import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// DM Sans for ImageResponse, committed in assets/fonts (no runtime fetch).
const dir = join(process.cwd(), "assets/fonts");

let fonts: Promise<{ name: string; data: Buffer; weight: 500 | 700; style: "normal" }[]> | null = null;

export function ogFonts() {
  fonts ??= Promise.all([
    readFile(join(dir, "DMSans-Medium.ttf")).then((data) => ({ name: "DM Sans", data, weight: 500 as const, style: "normal" as const })),
    readFile(join(dir, "DMSans-Bold.ttf")).then((data) => ({ name: "DM Sans", data, weight: 700 as const, style: "normal" as const })),
  ]);
  return fonts;
}

export const OG_SIZE = { width: 1200, height: 630 };
