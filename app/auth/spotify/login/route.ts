import type { NextRequest } from "next/server";
import { signInWithDummy } from "@/lib/server/auth";

// TODO(milestone 7): real Spotify Authorization Code + PKCE (scopes
// user-read-private user-top-read), redirecting to {APP_URL}/auth/spotify/callback;
// the callback then calls completeSignIn (lib/server/auth/complete-sign-in.ts).
// Until then this is the silent fallback: a dummy persona, landing exactly
// where a real sign-in would.
export async function GET(request: NextRequest) {
  return signInWithDummy(request.nextUrl.searchParams.get("returnTo"));
}
