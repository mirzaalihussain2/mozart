import type { NextRequest } from "next/server";
import { safeReturnTo } from "@/lib/return-to";
import { seeOther, signInWithFallback } from "@/lib/server/auth";
import { buildAuthorizeUrl, spotifyEnabled } from "@/lib/server/spotify/client";
import { setOAuthCookie } from "@/lib/server/spotify/oauth-cookie";
import { challengeFor, createState, createVerifier } from "@/lib/server/spotify/pkce";
import { getSpotifyRedirectUri, resolveSpotifyApp } from "@/lib/server/spotify/registry";

// "Connect Spotify" (landing) and "Continue with Spotify" (Send-to sheet).
// Authorization Code + PKCE. Without credentials, or on Vercel previews (no
// redirect URI is registered there), it's the silent fallback (Candice).
export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  const queryApp = request.nextUrl.searchParams.get("app");
  const cookieApp = request.cookies.get("mozart_invite_app")?.value;
  const host = request.headers.get("host");

  const app = resolveSpotifyApp({ queryApp, cookieApp, host });
  if (!spotifyEnabled(app)) return signInWithFallback(returnTo);

  const verifier = createVerifier();
  const state = createState();
  await setOAuthCookie({ state, verifier, returnTo, appKey: app.key });
  const redirectUri = await getSpotifyRedirectUri(app);

  return seeOther(
    buildAuthorizeUrl({
      state,
      challenge: challengeFor(verifier),
      redirectUri,
      clientId: app.clientId,
    }),
  );
}
