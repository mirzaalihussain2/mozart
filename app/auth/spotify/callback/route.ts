import type { NextRequest } from "next/server";
import { getAppUrl } from "@/lib/server/app-url";
import { signInWithFallback } from "@/lib/server/auth";
import { completeSignIn } from "@/lib/server/auth/complete-sign-in";
import { upsertSpotifyUser } from "@/lib/server/auth/spotify-user";
import { exchangeCode, fetchProfileAndTaste, SpotifyError, type SpotifyFailure } from "@/lib/server/spotify/client";
import { takeOAuthCookie } from "@/lib/server/spotify/oauth-cookie";

// Spotify → here. Any failure (cancel, bad state, token, 401/403/429, a
// 5 s timeout, anything thrown) silently becomes the fallback persona (Candice,
// or Derek from one of her tracks), landing
// exactly where a real sign-in would. Success upserts the user and finishes
// in completeSignIn (session, claiming, toast, redirect).
export async function GET(request: NextRequest) {
  const saved = await takeOAuthCookie(); // always cleared
  const returnTo = saved?.returnTo ?? "/create";
  const fallback = (reason: SpotifyFailure) => {
    console.warn(`[spotify] sign-in fell back to a demo persona: ${reason}`);
    return signInWithFallback(returnTo);
  };

  const params = request.nextUrl.searchParams;
  if (params.get("error")) return fallback("denied");
  if (!saved || !params.get("state") || params.get("state") !== saved.state) return fallback("state");
  const code = params.get("code");
  if (!code) return fallback("denied");

  try {
    const accessToken = await exchangeCode({ code, verifier: saved.verifier, redirectUri: `${await getAppUrl()}/auth/spotify/callback` });
    const { profile, taste } = await fetchProfileAndTaste(accessToken);
    const userId = await upsertSpotifyUser(profile, taste);
    return completeSignIn({ userId, returnTo });
  } catch (err) {
    return fallback(err instanceof SpotifyError ? err.reason : "unknown");
  }
}
