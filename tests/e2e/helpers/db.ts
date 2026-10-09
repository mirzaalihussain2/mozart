// Test-only database helper (uses DATABASE_URL from .env.local). Deletes the
// tracks a test created; the seeded tracks are never touched.
import { config } from "dotenv";
import postgres from "postgres";
import { SEED_TRACKS } from "../../../lib/config/dummy-user";

config({ path: ".env.local", quiet: true });

const SEEDED = SEED_TRACKS.map((t) => t.publicSlug);
let sql: postgres.Sql | null = null;
const db = () => (sql ??= postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 }));

/** Deletes tracks by slug, skipping seeded ones. Returns how many were removed. */
export async function deleteTracks(slugs: string[]): Promise<number> {
  const doomed = slugs.filter((s) => !SEEDED.includes(s));
  if (!doomed.length) return 0;
  const rows = await db()`delete from tracks where public_slug in ${db()(doomed)} returning id`;
  return rows.length;
}

/** Slugs of every non-seeded track (for one-off cleanup). */
export async function nonSeededSlugs(): Promise<string[]> {
  const rows = await db()<{ public_slug: string }[]>`select public_slug from tracks where public_slug not in ${db()(SEEDED)}`;
  return rows.map((r) => r.public_slug);
}

export async function closeDb() {
  await sql?.end();
  sql = null;
}
