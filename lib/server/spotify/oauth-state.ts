import "server-only";
import { sealData, unsealData } from "iron-session";
import { safeReturnTo } from "../../return-to";

// What survives the round trip to Spotify, sealed (no new tables).

export type OAuthState = { state: string; verifier: string; returnTo: string };

export const OAUTH_TTL_SECONDS = 10 * 60;

export function sealOAuthState(data: OAuthState, password: string): Promise<string> {
  return sealData({ ...data, returnTo: safeReturnTo(data.returnTo) }, { password, ttl: OAUTH_TTL_SECONDS });
}

/** The sealed state, or null if it's missing, tampered with, expired or malformed. */
export async function unsealOAuthState(sealed: string | undefined, password: string): Promise<OAuthState | null> {
  if (!sealed) return null;
  try {
    const data = await unsealData<Partial<OAuthState>>(sealed, { password, ttl: OAUTH_TTL_SECONDS });
    if (typeof data.state !== "string" || typeof data.verifier !== "string" || !data.state || !data.verifier) return null;
    return { state: data.state, verifier: data.verifier, returnTo: safeReturnTo(data.returnTo) };
  } catch {
    return null;
  }
}
