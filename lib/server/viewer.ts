import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { MODE_NOUN, type SignInPrompt } from "../sign-in-prompt";
import { getAnonId } from "./anon";
import { db } from "./db";
import { tracks } from "./db/schema";
import { getCurrentUser } from "./session";
import { sendToName, type TrackWithOwner } from "./tracks";

/**
 * Who's looking at `track`, decided on the server (the client never decides
 * who it is): signed in, the anonymous maker of this track, or another
 * anonymous visitor — plus what a signed-out visitor needs for the Send-to
 * sheet. The anonymous id itself never leaves the server.
 */
export async function viewerFor(track: TrackWithOwner, { preview = false } = {}) {
  const user = await getCurrentUser();
  if (user) {
    const isOwner = track.ownerUserId === user.id;
    // "Open as recipient": show the owner exactly what a signed-out friend gets.
    const signIn: SignInPrompt | undefined =
      isOwner && preview
        ? {
            sendTo: (await sendToName(track.id)) ?? "them",
            href: `/auth/spotify/login?returnTo=${encodeURIComponent(`/track/${track.publicSlug}`)}`,
            makeUsed: false,
            noun: MODE_NOUN[track.mode],
          }
        : undefined;
    return { user, isOwner, isAnonMaker: false, signIn };
  }

  const anonId = await getAnonId();
  const made = anonId ? await anonTrack(anonId) : null;
  const isAnonMaker = !!anonId && !track.ownerUserId && track.anonymousSessionId === anonId;
  // Signing in returns to their own track (share sheet open) if they made one, else here.
  const returnTo = made ? `/track/${made.slug}?share=1` : `/track/${track.publicSlug}`;
  const signIn: SignInPrompt = {
    sendTo: (await sendToName(made?.id ?? track.id)) ?? "them",
    href: `/auth/spotify/login?returnTo=${encodeURIComponent(returnTo)}`,
    makeUsed: !!made,
    noun: MODE_NOUN[made?.mode ?? track.mode],
  };
  return { user: null, isOwner: false, isAnonMaker, signIn };
}

/** This browser's (first) unclaimed anonymous track. */
async function anonTrack(anonId: string) {
  const [row] = await db
    .select({ id: tracks.id, slug: tracks.publicSlug, mode: tracks.mode })
    .from(tracks)
    .where(and(eq(tracks.anonymousSessionId, anonId), isNull(tracks.ownerUserId)))
    .orderBy(asc(tracks.createdAt))
    .limit(1);
  return row ?? null;
}

/** "A friend" for an unowned track to anyone but its maker; the maker sees "You". */
export function artistLabel(track: TrackWithOwner, isAnonMaker: boolean): string {
  return track.owner?.firstName ?? (isAnonMaker ? "You" : "A friend");
}
