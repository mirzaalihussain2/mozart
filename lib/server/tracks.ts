import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { tracks, users, type Track, type User } from "./db/schema";

export type TrackWithOwner = Track & { owner: Pick<User, "id" | "firstName"> | null };

/** A user's tracks, newest first (tech-spec §15). */
export async function listLibrary(userId: string): Promise<Track[]> {
  return db.select().from(tracks).where(eq(tracks.ownerUserId, userId)).orderBy(desc(tracks.createdAt));
}

/** A track by its public slug, with the owner's first name; null if missing. */
export async function getTrackBySlug(slug: string): Promise<TrackWithOwner | null> {
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
}
