// pnpm db:seed — idempotent: upserts the personas (Ali, Sam) and Ali's six tracks in
// 07-01 (by slug), refreshing their dates relative to now. Every track points
// at a real catalogue file in public/audio/.
// Uses its own client because lib/server/db imports "server-only".
import { config } from "dotenv";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { AUDIO_CATALOGUE } from "../lib/config/audio-catalogue";
import { DUMMY_USER, PERSONAS, SEED_TRACKS } from "../lib/config/dummy-user";
import { tracks, users } from "../lib/server/db/schema";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
  const sql = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(sql);

  try {
    for (const { id, ...userFields } of PERSONAS) {
      await db
        .insert(users)
        .values({ id, ...userFields })
        .onConflictDoUpdate({ target: users.id, set: userFields });
    }

    // Sources first, so derived tracks can point at them.
    const ordered = [...SEED_TRACKS].sort((a, b) => Number(!!a.source) - Number(!!b.source));
    const ids = new Map<string, string>();
    const now = Date.now();
    for (const t of ordered) {
      const audio = AUDIO_CATALOGUE.find((a) => a.id === t.audio);
      if (!audio) throw new Error(`Unknown catalogue id "${t.audio}" for ${t.publicSlug}`);
      const fields = {
        publicSlug: t.publicSlug,
        mode: t.mode,
        title: t.title,
        audioUrl: audio.file,
        artworkUrl: null,
        generationInput: {
          ...t.generationInput,
          ...(t.source ? { sourceTrackId: ids.get(t.source) ?? "" } : {}),
          audioId: audio.id,
        },
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
    console.log(`Seeded ${PERSONAS.map((p) => p.firstName).join(" + ")}, ${seeded.length} tracks (${userCount} users, ${trackCount} tracks total)`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
