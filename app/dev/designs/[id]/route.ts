import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { isProduction } from "@/lib/server/dev-gate";

// Serves docs/designs/png/{id}_*.png for /dev/compare. Dev and previews only.
const DIR = path.join(process.cwd(), "docs/designs/png");

export async function GET(_request: Request, { params }: RouteContext<"/dev/designs/[id]">) {
  if (isProduction()) return new Response("Not found", { status: 404 });
  const { id } = await params;
  if (!/^\d{2}-\d{2}$/.test(id)) return new Response("Not found", { status: 404 });
  const file = (await readdir(DIR)).find((f) => f.startsWith(`${id}_`));
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(await readFile(path.join(DIR, file))), {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
  });
}
