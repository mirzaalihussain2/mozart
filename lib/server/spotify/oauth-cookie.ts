import "server-only";
import { cookies } from "next/headers";
import { OAUTH_TTL_SECONDS, sealOAuthState, unsealOAuthState, type OAuthState } from "./oauth-state";

// `mozart_oauth`: { state, verifier, returnTo }, sealed with SESSION_SECRET.
// httpOnly, Secure in production, Lax, path /auth/spotify, 10 minutes.

const NAME = "mozart_oauth";
const PATH = "/auth/spotify";

function password(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be set and at least 32 characters");
  return secret;
}

export async function setOAuthCookie(data: OAuthState): Promise<void> {
  (await cookies()).set(NAME, await sealOAuthState(data, password()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: PATH,
    maxAge: OAUTH_TTL_SECONDS,
  });
}

/** Reads and always deletes the cookie. Null if missing, tampered with or expired. */
export async function takeOAuthCookie(): Promise<OAuthState | null> {
  const store = await cookies();
  const sealed = store.get(NAME)?.value;
  store.delete({ name: NAME, path: PATH });
  return unsealOAuthState(sealed, password());
}
