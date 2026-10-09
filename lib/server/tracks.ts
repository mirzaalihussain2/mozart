import "server-only";
import { desc, eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "./db";
import { tracks, users, type Track, type User } from "./db/schema";

export type TrackWithOwner = Track & { owner: Pick<User, "id" | "firstName"> | null };

/** A user's tracks, newest first (tech-spec §15). */
export async function listLibrary(userId: string): Promise<Track[]> {
  return db.select().from(tracks).where(eq(tracks.ownerUserId, userId)).orderBy(desc(tracks.createdAt));
}

/** A track by id; null if missing. */
export async function getTrackById(id: string): Promise<Track | null> {
  const [row] = await db.select().from(tracks).where(eq(tracks.id, id)).limit(1);
  return row ?? null;
}

/**
 * A track by its public slug, with the owner's first name; null if missing.
 * Cached per request so the page and its generateMetadata share one query.
 */
export const getTrackBySlug = cache(async (slug: string): Promise<TrackWithOwner | null> => {
  const [row] = await db
    .select({ track: tracks, ownerId: users.id, ownerFirstName: users.firstName })
    .from(tracks)
    .leftJoin(users, eq(users.id, tracks.ownerUserId))
    .where(eq(tracks.publicSlug, slug))
    .limit(1);
  if (!row) return null;
  return {
    ...row.track,
    owner: row.ownerId && row.ownerFirstName ? { id: row.ownerId, firstName: row.ownerFirstName } : null,
  };
});

/**
 * Who a recipient "sends to" from this track: its owner's first name, or for
 * an unowned (anonymous) track, the owner of the track it was made from.
 */
export async function sendToName(trackId: string): Promise<string | null> {
  let id: string | null = trackId;
  for (let depth = 0; id && depth < 4; depth++) {
    const [row] = await db
      .select({ source: tracks.sourceTrackId, owner: users.firstName })
      .from(tracks)
      .leftJoin(users, eq(users.id, tracks.ownerUserId))
      .where(eq(tracks.id, id))
      .limit(1);
    if (!row) return null;
    if (row.owner) return row.owner;
    id = row.source;
  }
  return null;
}
