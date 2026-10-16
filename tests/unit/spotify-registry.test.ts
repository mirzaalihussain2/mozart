import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getSpotifyApp,
  getSpotifyAppByHost,
  isSpotifyAppEnabled,
  listSpotifyApps,
  resolveRedirectUriForDomain,
  resolveSpotifyApp,
} from "../../lib/server/spotify/registry";
import { sealOAuthState, unsealOAuthState } from "../../lib/server/spotify/oauth-state";

const SECRET = "x".repeat(40);

test("getSpotifyApp returns config for registered apps and defaults to maestro", () => {
  const maestro = getSpotifyApp("maestro");
  assert.equal(maestro.key, "maestro");
  assert.equal(maestro.name, "Maestro");
  assert.equal(maestro.productionDomain, "maestro-mozart.vercel.app");

  const podbro = getSpotifyApp("podbro");
  assert.equal(podbro.key, "podbro");
  assert.equal(podbro.name, "PodBro");
  assert.equal(podbro.productionDomain, "podbro-beethoven.vercel.app");

  const fallback = getSpotifyApp("unknown" as unknown as string);
  assert.equal(fallback.key, "maestro");
});

test("getSpotifyAppByHost matches production domains", () => {
  assert.equal(getSpotifyAppByHost("podbro-beethoven.vercel.app").key, "podbro");
  assert.equal(getSpotifyAppByHost("musicmundays-chopin.vercel.app:443").key, "musicmundays");
  assert.equal(getSpotifyAppByHost("audiobro-vivaldi.vercel.app").key, "audiobro");
  assert.equal(getSpotifyAppByHost("mediamatch-bach.vercel.app").key, "mediamatch");
  assert.equal(getSpotifyAppByHost("podbash-wagner.vercel.app").key, "podbash");
  assert.equal(getSpotifyAppByHost("unknown-domain.com").key, "maestro");
  assert.equal(getSpotifyAppByHost(null).key, "maestro");
});

test("resolveSpotifyApp respects priority (query > cookie > host > default)", () => {
  assert.equal(
    resolveSpotifyApp({ queryApp: "podbro", cookieApp: "musicmundays", host: "audiobro-vivaldi.vercel.app" }).key,
    "podbro",
  );
  assert.equal(
    resolveSpotifyApp({ cookieApp: "musicmundays", host: "audiobro-vivaldi.vercel.app" }).key,
    "musicmundays",
  );
  assert.equal(
    resolveSpotifyApp({ host: "audiobro-vivaldi.vercel.app" }).key,
    "audiobro",
  );
  assert.equal(
    resolveSpotifyApp({ host: "localhost:3000" }).key,
    "maestro",
  );
});

test("resolveRedirectUriForDomain preserves local loopback address for dev/tests", () => {
  const podbro = getSpotifyApp("podbro");
  assert.equal(
    resolveRedirectUriForDomain(podbro, "http://127.0.0.1:3000"),
    "http://127.0.0.1:3000/auth/spotify/callback",
  );
  assert.equal(
    resolveRedirectUriForDomain(podbro, "http://localhost:3001"),
    "http://localhost:3001/auth/spotify/callback",
  );
});

test("resolveRedirectUriForDomain uses dedicated production domain in production", () => {
  const podbro = getSpotifyApp("podbro");
  assert.equal(
    resolveRedirectUriForDomain(podbro, "https://anywhere.com"),
    "https://podbro-beethoven.vercel.app/auth/spotify/callback",
  );

  const vivaldi = getSpotifyApp("audiobro");
  assert.equal(
    resolveRedirectUriForDomain(vivaldi, "https://anywhere.com"),
    "https://audiobro-vivaldi.vercel.app/auth/spotify/callback",
  );
});

test("isSpotifyAppEnabled validates credentials and environment", () => {
  const saved = { ...process.env };
  process.env.SPOTIFY_CLIENT_ID_4_PODBRO = "test-id";
  process.env.SPOTIFY_CLIENT_SECRET_4_PODBRO = "test-secret";
  delete process.env.VERCEL_ENV;

  const podbro = getSpotifyApp("podbro");
  assert.equal(isSpotifyAppEnabled(podbro), true);

  process.env.VERCEL_ENV = "preview";
  assert.equal(isSpotifyAppEnabled(podbro), false);

  process.env.VERCEL_ENV = "production";
  assert.equal(isSpotifyAppEnabled(podbro), true);

  delete process.env.SPOTIFY_CLIENT_SECRET_4_PODBRO;
  const podbroNoSecret = getSpotifyApp("podbro");
  assert.equal(isSpotifyAppEnabled(podbroNoSecret), false);

  Object.assign(process.env, saved);
});

test("OAuth state round-trips with optional appKey", async () => {
  const sealed = await sealOAuthState(
    { state: "s1", verifier: "v1", returnTo: "/track/abc", appKey: "podbro" },
    SECRET,
  );
  const unsealed = await unsealOAuthState(sealed, SECRET);
  assert.deepEqual(unsealed, {
    state: "s1",
    verifier: "v1",
    returnTo: "/track/abc",
    appKey: "podbro",
  });
});

test("listSpotifyApps lists all 6 apps without leaking secrets", () => {
  const list = listSpotifyApps();
  assert.equal(list.length, 6);
  assert.deepEqual(
    list.map((a) => a.key),
    ["maestro", "mediamatch", "musicmundays", "podbro", "audiobro", "podbash"],
  );
  for (const item of list) {
    assert.ok(!("clientSecret" in item));
    assert.ok(typeof item.name === "string");
    assert.ok(typeof item.productionDomain === "string");
    assert.ok(typeof item.enabled === "boolean");
  }
});
