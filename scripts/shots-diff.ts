// pnpm shots:diff [id ...] — compare .shots/{id}.png with docs/designs/png/{id}_*.png.
// Writes .shots/{id}.diff.png (differences in magenta over a dimmed design) and
// prints the horizontal bands (in pt, 390 × 844) where the two images differ.
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { SHOTS } from "./shots.config";

const DESIGN_DIR = path.resolve("docs/designs/png");
const SHOT_DIR = path.resolve(".shots");
const SCALE = 3;

type Result = { width: number; height: number; diffRatio: number; bands: [number, number][]; png: string };

async function main() {
  const filter = process.argv.slice(2);
  const ids = filter.length ? filter : SHOTS.filter((s) => !s.noDesign).map((s) => s.id);
  const designs = await readdir(DESIGN_DIR);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  // tsx (esbuild keepNames) wraps named functions in __name(), which the page lacks.
  await page.evaluate("window.__name = (fn) => fn");

  try {
    for (const id of ids) {
      const designFile = designs.find((f) => f.startsWith(`${id}_`));
      if (!designFile) throw new Error(`No design PNG for ${id}`);
      const [design, shot] = await Promise.all([
        readFile(path.join(DESIGN_DIR, designFile), "base64"),
        readFile(path.join(SHOT_DIR, `${id}.png`), "base64"),
      ]);

      const result: Result = await page.evaluate(
        async ({ design, shot, scale }) => {
          const load = (b64: string) =>
            new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = `data:image/png;base64,${b64}`;
            });
          const [a, b] = await Promise.all([load(design), load(shot)]);
          const width = Math.min(a.width, b.width);
          const height = Math.min(a.height, b.height);
          const pixels = (img: HTMLImageElement) => {
            const c = new OffscreenCanvas(width, height);
            const ctx = c.getContext("2d")!;
            ctx.drawImage(img, 0, 0);
            return ctx.getImageData(0, 0, width, height).data;
          };
          const pa = pixels(a);
          const pb = pixels(b);
          const out = new ImageData(width, height);
          const rowDiff = new Array<number>(height).fill(0);
          let diff = 0;
          for (let i = 0; i < pa.length; i += 4) {
            const d = Math.max(Math.abs(pa[i] - pb[i]), Math.abs(pa[i + 1] - pb[i + 1]), Math.abs(pa[i + 2] - pb[i + 2]));
            const differs = d > 24;
            const g = pa[i] * 0.3;
            out.data[i] = differs ? 255 : g;
            out.data[i + 1] = differs ? 0 : g;
            out.data[i + 2] = differs ? 255 : g;
            out.data[i + 3] = 255;
            if (differs) {
              diff++;
              rowDiff[Math.floor(i / 4 / width)]++;
            }
          }
          // Rows (in pt) with more than 1 pt worth of differing pixels.
          const bands: [number, number][] = [];
          for (let y = 0; y < height; y++) {
            if (rowDiff[y] <= scale) continue;
            const pt = Math.floor(y / scale);
            const last = bands[bands.length - 1];
            if (last && pt - last[1] <= 1) last[1] = pt;
            else bands.push([pt, pt]);
          }
          const c = new OffscreenCanvas(width, height);
          c.getContext("2d")!.putImageData(out, 0, 0);
          const blob = await c.convertToBlob({ type: "image/png" });
          const buf = new Uint8Array(await blob.arrayBuffer());
          let bin = "";
          for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
          return { width, height, diffRatio: diff / (width * height), bands, png: btoa(bin) };
        },
        { design, shot, scale: SCALE },
      );

      const outFile = path.join(SHOT_DIR, `${id}.diff.png`);
      await writeFile(outFile, Buffer.from(result.png, "base64"));
      console.log(`${id}  ${(result.diffRatio * 100).toFixed(2)}% pixels differ  →  ${path.relative(process.cwd(), outFile)}`);
      for (const [from, to] of result.bands) console.log(`  y ${from}–${to} pt`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
