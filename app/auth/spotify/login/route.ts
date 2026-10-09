import type { NextRequest } from "next/server";
import { safeReturnTo } from "@/lib/return-to";
import { getAppUrl } from "@/lib/server/app-url";
import { seeOther, signInWithFallback } from "@/lib/server/auth";
import { buildAuthorizeUrl, spotifyEnabled } from "@/lib/server/spotify/client";
import { setOAuthCookie } from "@/lib/server/spotify/oauth-cookie";
import { challengeFor, createState, createVerifier } from "@/lib/server/spotify/pkce";

// "Connect Spotify" (landing) and "Continue with Spotify" (Send-to sheet).
// Authorization Code + PKCE. Without credentials, or on Vercel previews (no
// redirect URI is registered there), it's the silent fallback (Candice).
export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  if (!spotifyEnabled()) return signInWithFallback(returnTo);

  const verifier = createVerifier();
  const state = createState();
  await setOAuthCookie({ state, verifier, returnTo });
  return seeOther(
    buildAuthorizeUrl({ state, challenge: challengeFor(verifier), redirectUri: `${await getAppUrl()}/auth/spotify/callback` }),
  );
}
