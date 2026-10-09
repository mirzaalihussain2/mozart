// pnpm db:seed — idempotent: upserts the dummy user Ali and one track.
// Uses its own client because lib/server/db imports "server-only".
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DUMMY_USER, SEED_TRACK } from "../lib/config/dummy-user";
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

    const trackFields = { ...SEED_TRACK, ownerUserId: DUMMY_USER.id };
    await db
      .insert(tracks)
      .values(trackFields)
      .onConflictDoUpdate({ target: tracks.publicSlug, set: trackFields });

    const [{ userCount }] = await sql<{ userCount: number }[]>`select count(*)::int as "userCount" from users`;
    const [{ trackCount }] = await sql<{ trackCount: number }[]>`select count(*)::int as "trackCount" from tracks`;
    console.log(`Seeded: ${DUMMY_USER.firstName} + "${SEED_TRACK.title}" (${userCount} users, ${trackCount} tracks)`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
