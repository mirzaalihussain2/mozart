import type { NextRequest } from "next/server";
import { signInAsDummy } from "@/lib/server/auth";

// TODO(milestone 7): real Spotify Authorization Code + PKCE (scopes
// user-read-private user-top-read), redirecting to {APP_URL}/auth/spotify/callback.
// Until then this is the silent fallback: sign in as the dummy user and land
// exactly where a real sign-in would.
export async function GET(request: NextRequest) {
  return signInAsDummy(request.nextUrl.searchParams.get("returnTo"));
}
