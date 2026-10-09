import "server-only";
import { mapProfile, mapTaste } from "../../spotify/map-taste";
import type { SpotifyArtist, SpotifyPage, SpotifyProfile, SpotifyTokenResponse, SpotifyTrack } from "../../spotify/types";
import type { SpotifyTaste } from "../../types/taste";

// Every Spotify HTTP call lives here. Authorization Code + PKCE, scopes
// user-read-private user-top-read. Tokens are used once and never stored.

export const SCOPES = "user-read-private user-top-read";
const TIMEOUT_MS = 5000;

export type SpotifyFailure = "denied" | "state" | "token" | "forbidden" | "rate_limited" | "timeout" | "unknown";

export class SpotifyError extends Error {
  constructor(readonly reason: SpotifyFailure) {
    super(`spotify:${reason}`);
    this.name = "SpotifyError";
  }
}

const isProduction = () => process.env.VERCEL_ENV === "production";
/** Test overrides (a fake Spotify), ignored in production. */
const accountsUrl = () => (!isProduction() && process.env.SPOTIFY_ACCOUNTS_URL) || "https://accounts.spotify.com";
const apiUrl = () => (!isProduction() && process.env.SPOTIFY_API_URL) || "https://api.spotify.com";

/** Real Spotify only with credentials, and never on previews (no redirect URI is registered there). */
export function spotifyEnabled(): boolean {
  return !!process.env.SPOTIFY_CLIENT_ID && !!process.env.SPOTIFY_CLIENT_SECRET && process.env.VERCEL_ENV !== "preview";
}

export function buildAuthorizeUrl({ state, challenge, redirectUri }: { state: string; challenge: string; redirectUri: string }): string {
  const url = new URL("/authorize", accountsUrl());
  url.search = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID ?? "",
    response_type: "code",
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
    scope: SCOPES,
  }).toString();
  return url.toString();
}

async function call(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    const name = (err as { name?: string })?.name;
    throw new SpotifyError(name === "TimeoutError" || name === "AbortError" ? "timeout" : "unknown");
  }
}

function failureFor(status: number): SpotifyFailure {
  if (status === 401 || status === 403) return "forbidden";
  if (status === 429) return "rate_limited";
  return "unknown";
}

/** Code → access token (server-side, with the client secret as Basic auth). */
export async function exchangeCode({ code, verifier, redirectUri }: { code: string; verifier: string; redirectUri: string }): Promise<string> {
  const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const res = await call(new URL("/api/token", accountsUrl()).toString(), {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
      client_id: process.env.SPOTIFY_CLIENT_ID ?? "",
    }),
  });
  if (!res.ok) throw new SpotifyError(res.status === 429 ? "rate_limited" : "token");
  const body = (await res.json().catch(() => null)) as SpotifyTokenResponse | null;
  if (!body?.access_token) throw new SpotifyError("token");
  return body.access_token;
}

/**
 * /v1/me plus top tracks and artists, in parallel. A failed profile is a
 * failed sign-in; failed top lists just mean empty taste.
 */
export async function fetchProfileAndTaste(accessToken: string): Promise<{ profile: ReturnType<typeof mapProfile>; taste: SpotifyTaste }> {
  const get = (path: string) => call(new URL(path, apiUrl()).toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  const [me, tracks, artists] = await Promise.all([
    get("/v1/me"),
    get("/v1/me/top/tracks?limit=50&time_range=medium_term").catch(() => null),
    get("/v1/me/top/artists?limit=50&time_range=medium_term").catch(() => null),
  ]);
  if (!me.ok) throw new SpotifyError(failureFor(me.status));
  const profile = (await me.json().catch(() => null)) as SpotifyProfile | null;
  if (!profile?.id) throw new SpotifyError("unknown");

  const items = async <T,>(res: Response | null): Promise<T[]> =>
    res?.ok ? (((await res.json().catch(() => null)) as SpotifyPage<T> | null)?.items ?? []) : [];
  return {
    profile: mapProfile(profile),
    taste: mapTaste(await items<SpotifyTrack>(tracks), await items<SpotifyArtist>(artists)),
  };
}
