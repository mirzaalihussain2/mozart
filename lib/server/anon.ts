import "server-only";
import { and, count, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { ANON_COOKIE, anonCookieOptions, isUuid } from "../anon-cookie";
import { db } from "./db";
import { tracks } from "./db/schema";

// Anonymous recipients (AGENTS.md §3): a random UUID in `mozart_anon`, set only
// when a signed-out visitor makes their first track (POST /api/generate).

/** This browser's anonymous id, or null. Anything that isn't a UUID is ignored. */
export async function getAnonId(): Promise<string | null> {
  const value = (await cookies()).get(ANON_COOKIE)?.value;
  return isUuid(value) ? value : null;
}

/** Route handlers only: the anonymous id, creating the cookie if it's missing. */
export async function getOrCreateAnonId(): Promise<string> {
  const existing = await getAnonId();
  if (existing) return existing;
  const id = crypto.randomUUID();
  (await cookies()).set(ANON_COOKIE, id, anonCookieOptions(process.env.NODE_ENV === "production"));
  return id;
}

/** Route handlers only: forget this browser's anonymous id. */
export async function clearAnonId(): Promise<void> {
  (await cookies()).delete({ name: ANON_COOKIE, path: "/" });
}

/** How many unclaimed tracks this anonymous id has made (the limit is one). */
export async function countAnonTracks(anonId: string): Promise<number> {
  const [{ n }] = await db
    .select({ n: count() })
    .from(tracks)
    .where(and(eq(tracks.anonymousSessionId, anonId), isNull(tracks.ownerUserId)));
  return n;
}
