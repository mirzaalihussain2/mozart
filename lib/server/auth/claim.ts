import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { tracks } from "../db/schema";

/**
 * Moves this browser's unowned anonymous tracks to `userId` in one atomic
 * UPDATE. Safe to run twice: the second run matches nothing. Never touches a
 * track that already has an owner, or another browser's id.
 */
export async function claimAnonTracks(anonId: string, userId: string): Promise<{ id: string; slug: string }[]> {
  return db
    .update(tracks)
    .set({ ownerUserId: userId, anonymousSessionId: null })
    .where(and(eq(tracks.anonymousSessionId, anonId), isNull(tracks.ownerUserId)))
    .returning({ id: tracks.id, slug: tracks.publicSlug });
}
