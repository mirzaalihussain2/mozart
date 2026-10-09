import "server-only";
import { eq } from "drizzle-orm";
import { PERSONAS, type Persona } from "../../config/dummy-user";
import { pickPersona, trackSlugFromPath } from "../../sign-in";
import { db } from "../db";
import { tracks, users } from "../db/schema";
import { getTrackBySlug } from "../tracks";

/**
 * Who a dummy sign-in becomes: the first persona who isn't the owner of the
 * track named in `returnTo` (for an anonymous track, the owner of the track
 * it was made from). No track → Ali. Server-side only; never trusts a name
 * from the client.
 */
export async function pickDummyPersona(returnTo: string): Promise<Persona> {
  const slug = trackSlugFromPath(returnTo);
  if (!slug) return PERSONAS[0];
  const track = await getTrackBySlug(slug);
  let ownerId = track?.ownerUserId ?? null;
  if (track && !ownerId && track.sourceTrackId) {
    const [source] = await db.select({ owner: tracks.ownerUserId }).from(tracks).where(eq(tracks.id, track.sourceTrackId)).limit(1);
    ownerId = source?.owner ?? null;
  }
  return pickPersona(PERSONAS, ownerId);
}

/** Creates or refreshes a persona's row, so production needs no seed run. */
export async function upsertPersona(persona: Persona): Promise<string> {
  const { id, ...fields } = persona;
  await db.insert(users).values({ id, ...fields }).onConflictDoUpdate({ target: users.id, set: fields });
  return id;
}
