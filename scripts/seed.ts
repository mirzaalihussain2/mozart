// pnpm db:seed — idempotent: upserts the dummy user Ali and the six tracks in
// 07-01 (by slug), refreshing their dates relative to now.
// Uses its own client because lib/server/db imports "server-only".
import { config } from "dotenv";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DUMMY_USER, PLACEHOLDER_AUDIO, SEED_TRACKS } from "../lib/config/dummy-user";
import { tracks, users } from "../lib/server/db/schema";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
  const sql = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(sql);

  try {
    const { id, ...userFields } = DUMMY_USER;
    await db
      .insert(users)
      .values({ id, ...userFields })
      .onConflictDoUpdate({ target: users.id, set: userFields });

    // Sources first, so derived tracks can point at them.
    const ordered = [...SEED_TRACKS].sort((a, b) => Number(!!a.source) - Number(!!b.source));
    const ids = new Map<string, string>();
    const now = Date.now();
    for (const t of ordered) {
      const fields = {
        publicSlug: t.publicSlug,
        mode: t.mode,
        title: t.title,
        audioUrl: PLACEHOLDER_AUDIO,
        artworkUrl: null,
        generationInput: t.generationInput,
        sourceTrackId: t.source ? (ids.get(t.source) ?? null) : null,
        ownerUserId: DUMMY_USER.id,
        anonymousSessionId: null,
        createdAt: new Date(now - t.ageMinutes * 60_000),
      };
      const [row] = await db
        .insert(tracks)
        .values(fields)
        .onConflictDoUpdate({ target: tracks.publicSlug, set: fields })
        .returning({ id: tracks.id });
      ids.set(t.publicSlug, row.id);
    }

    const slugs = SEED_TRACKS.map((t) => t.publicSlug);
    const seeded = await db.select({ id: tracks.id }).from(tracks).where(inArray(tracks.publicSlug, slugs));
    const [{ userCount }] = await sql<{ userCount: number }[]>`select count(*)::int as "userCount" from users`;
    const [{ trackCount }] = await sql<{ trackCount: number }[]>`select count(*)::int as "trackCount" from tracks`;
    console.log(`Seeded ${DUMMY_USER.firstName} + ${seeded.length} tracks (${userCount} users, ${trackCount} tracks total)`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
