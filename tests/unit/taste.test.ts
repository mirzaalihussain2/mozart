// pnpm test:unit — whose taste fills the pickers, and the validator following it.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { MOCK_TASTE } from "../../lib/config/mock-taste";
import { CANDICE, DEREK } from "../../lib/config/personas";
import { singersFrom } from "../../lib/config/singers";
import { songsFrom } from "../../lib/config/songs";
import { parseGenerateInput, titleFor } from "../../lib/generation-input";
import { mapTaste } from "../../lib/spotify/map-taste";
import type { SpotifyArtist, SpotifyPage, SpotifyTrack } from "../../lib/spotify/types";
import { catalogueFor, getTasteFor } from "../../lib/server/taste";

const fixture = <T>(n: string): T => JSON.parse(readFileSync(`docs/fixtures/spotify/${n}.json`, "utf8")) as T;
const spotifyTaste = mapTaste(fixture<SpotifyPage<SpotifyTrack>>("top-tracks").items, fixture<SpotifyPage<SpotifyArtist>>("top-artists").items);
const spotifyUser = { authProvider: "spotify" as const, spotifyTaste };

test("users with enough tracks get their own taste (Spotify users, Derek, Candice); signed-out visitors MOCK_TASTE", () => {
  assert.equal(getTasteFor(spotifyUser), spotifyTaste);
  assert.equal(getTasteFor(DEREK), DEREK.spotifyTaste);
  assert.equal(getTasteFor(CANDICE), CANDICE.spotifyTaste);
  assert.equal(getTasteFor(null), MOCK_TASTE);
  const thin = { authProvider: "spotify" as const, spotifyTaste: { ...spotifyTaste, topTracks: spotifyTaste.topTracks.slice(0, 5) } };
  assert.equal(getTasteFor(thin), MOCK_TASTE);
  const noArtists = { authProvider: "spotify" as const, spotifyTaste: { ...spotifyTaste, topArtists: [] } };
  assert.deepEqual(getTasteFor(noArtists).topArtists, MOCK_TASTE.topArtists);
});

test("the catalogue: real songs and singers for Spotify users", () => {
  const c = catalogueFor(spotifyUser);
  assert.equal(c.songs[0].title, "Way Too Self Aware");
  assert.equal(c.songs[0].id.length, 22);
  assert.ok(c.singers.some((s) => s.id === "fred-again" && s.name === "Fred again.."));
});

test("songs and singers carry the taste's artwork; the mock taste has none", () => {
  const songs = songsFrom(spotifyTaste);
  assert.deepEqual(songs.map((s) => s.imageUrl), spotifyTaste.topTracks.map((t) => t.imageUrl));
  assert.match(songs[0].imageUrl ?? "", /^https:\/\/i\.scdn\.co\/image\//);
  const fred = singersFrom(spotifyTaste).find((s) => s.id === "fred-again");
  assert.equal(fred?.imageUrl, spotifyTaste.topArtists.find((a) => a.name === "Fred again..")?.imageUrl);
  assert.match(fred?.imageUrl ?? "", /^https:\/\/i\.scdn\.co\/image\//);

  assert.ok(songsFrom(MOCK_TASTE).every((s) => s.imageUrl === null));
  assert.ok(singersFrom(MOCK_TASTE).every((s) => s.imageUrl === null));
});

test("validation follows the viewer's catalogue; names use the taste track as root", () => {
  const spotify = catalogueFor(spotifyUser);
  const dummy = catalogueFor(null); // MOCK_TASTE (signed-out visitors)
  const realId = spotify.songs[0].id;

  const ok = parseGenerateInput({ mode: "remix", sourceSongId: realId, genreId: "bollywood" }, spotify);
  assert.ok(ok.ok);
  if (ok.ok) assert.equal(titleFor(ok.input, spotify.songs[0].title, spotify), "Way Too Self Aware × Bollywood");

  assert.equal(parseGenerateInput({ mode: "remix", sourceSongId: realId, genreId: "bollywood" }, dummy).ok, false);
  assert.equal(parseGenerateInput({ mode: "remix", sourceSongId: "mock-track-01", genreId: "bollywood" }, spotify).ok, false);
  assert.ok(parseGenerateInput({ mode: "cover", sourceSongId: realId, singerId: "fred-again" }, spotify).ok);
  assert.equal(parseGenerateInput({ mode: "cover", sourceSongId: "mock-track-01", singerId: "frank-ocean" }, dummy).ok, false);
});

test("Derek and Candice: 20 songs and 10 singers each, all with real artwork, and every singer has a tagged file", async () => {
  const { AUDIO_CATALOGUE } = await import("../../lib/config/audio-catalogue");
  for (const p of [DEREK, CANDICE]) {
    const c = catalogueFor(p);
    assert.equal(c.songs.length, 20, p.firstName);
    assert.equal(c.singers.length, 10, p.firstName);
    assert.ok(c.songs.every((s) => s.imageUrl?.startsWith("https://i.scdn.co/")), `${p.firstName}'s covers`);
    assert.ok(c.singers.every((s) => s.imageUrl?.startsWith("https://i.scdn.co/")), `${p.firstName}'s photos`);
    for (const s of c.singers) assert.ok(AUDIO_CATALOGUE.some((a) => a.singers.includes(s.id)), `${s.name} (${s.id}) has a file`);
  }
});
