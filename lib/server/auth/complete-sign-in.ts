import "server-only";
import { signInRedirect } from "../../sign-in";
import { clearAnonId, getAnonId } from "../anon";
import { claimAnonTracks } from "./claim";
import { getSession } from "../session";
import { seeOther } from "./http";

/**
 * The one place sign-in finishes (dummy now, the Spotify callback in
 * milestone 7): sets the session, claims this browser's anonymous tracks,
 * forgets the anonymous cookie and redirects to `returnTo` — with `saved=1`
 * only if something was claimed. Route handlers only (it writes cookies).
 * `returnTo` must already be validated (lib/return-to.ts).
 */
export async function completeSignIn({ userId, returnTo }: { userId: string; returnTo: string }): Promise<Response> {
  const session = await getSession();
  session.userId = userId;
  await session.save();

  const anonId = await getAnonId();
  const claimed = anonId ? await claimAnonTracks(anonId, userId) : [];
  if (anonId) await clearAnonId();

  return seeOther(signInRedirect(returnTo, claimed.length));
}
