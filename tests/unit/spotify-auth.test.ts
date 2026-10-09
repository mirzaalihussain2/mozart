// pnpm test:unit — PKCE, the authorize URL and the sealed OAuth state.
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildAuthorizeUrl, spotifyEnabled } from "../../lib/server/spotify/client";
import { sealOAuthState, unsealOAuthState } from "../../lib/server/spotify/oauth-state";
import { challengeFor, createState, createVerifier } from "../../lib/server/spotify/pkce";

const SECRET = "x".repeat(40);

test("S256 challenge matches the RFC 7636 example", () => {
  assert.equal(challengeFor("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
});

test("verifier and state are URL-safe and random", () => {
  const v = createVerifier();
  assert.ok(v.length >= 43 && v.length <= 128, String(v.length));
  assert.match(v, /^[A-Za-z0-9_-]+$/);
  assert.notEqual(createVerifier(), v);
  assert.match(createState(), /^[A-Za-z0-9_-]{16,}$/);
});

test("authorize URL carries the right params", () => {
  process.env.SPOTIFY_CLIENT_ID = "client-123";
  const url = new URL(buildAuthorizeUrl({ state: "st", challenge: "ch", redirectUri: "http://127.0.0.1:3000/auth/spotify/callback" }));
  assert.equal(url.origin + url.pathname, (process.env.SPOTIFY_ACCOUNTS_URL ?? "https://accounts.spotify.com") + "/authorize");
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    client_id: "client-123",
    response_type: "code",
    redirect_uri: "http://127.0.0.1:3000/auth/spotify/callback",
    code_challenge_method: "S256",
    code_challenge: "ch",
    state: "st",
    scope: "user-read-private user-top-read",
  });
});

test("Spotify is skipped without credentials and on previews", () => {
  const saved = { ...process.env };
  process.env.SPOTIFY_CLIENT_ID = "id";
  process.env.SPOTIFY_CLIENT_SECRET = "secret";
  delete process.env.VERCEL_ENV;
  assert.equal(spotifyEnabled(), true);
  process.env.VERCEL_ENV = "preview";
  assert.equal(spotifyEnabled(), false);
  process.env.VERCEL_ENV = "production";
  assert.equal(spotifyEnabled(), true);
  delete process.env.SPOTIFY_CLIENT_SECRET;
  assert.equal(spotifyEnabled(), false);
  Object.assign(process.env, saved);
  for (const k of ["VERCEL_ENV", "SPOTIFY_CLIENT_SECRET"]) if (!(k in saved)) delete process.env[k];
});

test("the OAuth state round-trips and rejects tampering", async () => {
  const sealed = await sealOAuthState({ state: "s1", verifier: "v1", returnTo: "/track/abc?share=1" }, SECRET);
  assert.deepEqual(await unsealOAuthState(sealed, SECRET), { state: "s1", verifier: "v1", returnTo: "/track/abc?share=1" });
  assert.equal(await unsealOAuthState(sealed.slice(0, -4) + "AAAA", SECRET), null);
  assert.equal(await unsealOAuthState(sealed, "y".repeat(40)), null);
  assert.equal(await unsealOAuthState(undefined, SECRET), null);
  assert.equal(await unsealOAuthState("garbage", SECRET), null);
  // returnTo is validated on the way in.
  const evil = await sealOAuthState({ state: "s", verifier: "v", returnTo: "//evil.com" }, SECRET);
  assert.equal((await unsealOAuthState(evil, SECRET))?.returnTo, "/create");
});
