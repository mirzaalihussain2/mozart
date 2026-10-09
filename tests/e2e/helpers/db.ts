// Test-only database helper (uses DATABASE_URL from .env.local). Deletes the
// tracks a test created; Derek's and Candice's starter tracks are never
// touched (and every persona sign-in resets their libraries anyway).
import { config } from "dotenv";
import postgres from "postgres";
import { STARTER_SLUGS } from "../../../lib/config/personas";

config({ path: ".env.local", quiet: true });

const STARTERS = STARTER_SLUGS;
let sql: postgres.Sql | null = null;
const db = () => (sql ??= postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 }));

/** Deletes tracks by slug, skipping starter tracks. Returns how many were removed. */
export async function deleteTracks(slugs: string[]): Promise<number> {
  const doomed = slugs.filter((s) => !STARTERS.includes(s));
  if (!doomed.length) return 0;
  const rows = await db()`delete from tracks where public_slug in ${db()(doomed)} returning id`;
  return rows.length;
}

/** owner_user_id / anonymous_session_id / id of a track. */
export async function trackRow(slug: string): Promise<{ id: string; owner: string | null; anon: string | null } | null> {
  const [row] = await db()<{ id: string; owner: string | null; anon: string | null }[]>`
    select id, owner_user_id as owner, anonymous_session_id as anon from tracks where public_slug = ${slug}`;
  return row ?? null;
}

/** A user row by Spotify id (auth_provider, first name, id). */
export async function spotifyUser(spotifyUserId: string) {
  const [row] = await db()<{ id: string; first_name: string; auth_provider: string }[]>`
    select id, first_name, auth_provider from users where spotify_user_id = ${spotifyUserId}`;
  return row ?? null;
}

/** Deletes a Spotify test user and every track they own (seeded tracks are never theirs). */
export async function deleteSpotifyUser(spotifyUserId: string): Promise<void> {
  const user = await spotifyUser(spotifyUserId);
  if (!user) return;
  await db()`delete from tracks where owner_user_id = ${user.id}`;
  await db()`delete from users where id = ${user.id}`;
}

export async function closeDb() {
  await sql?.end();
  sql = null;
}
