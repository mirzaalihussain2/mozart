// pnpm test:unit — whose taste fills the pickers, and the validator following it.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { MOCK_TASTE } from "../../lib/config/mock-taste";
import { singersFrom } from "../../lib/config/singers";
import { songsFrom } from "../../lib/config/songs";
import { parseGenerateInput, titleFor } from "../../lib/generation-input";
import { mapTaste } from "../../lib/spotify/map-taste";
import type { SpotifyArtist, SpotifyPage, SpotifyTrack } from "../../lib/spotify/types";
import { catalogueFor, getTasteFor } from "../../lib/server/taste";

const fixture = <T>(n: string): T => JSON.parse(readFileSync(`docs/fixtures/spotify/${n}.json`, "utf8")) as T;
const spotifyTaste = mapTaste(fixture<SpotifyPage<SpotifyTrack>>("top-tracks").items, fixture<SpotifyPage<SpotifyArtist>>("top-artists").items);
const spotifyUser = { authProvider: "spotify" as const, spotifyTaste };
const dummyUser = { authProvider: "dummy" as const, spotifyTaste: MOCK_TASTE };

test("Spotify users with enough tracks get their own taste; everyone else MOCK_TASTE", () => {
  assert.equal(getTasteFor(spotifyUser), spotifyTaste);
  assert.equal(getTasteFor(dummyUser), MOCK_TASTE);
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
  const dummy = catalogueFor(dummyUser);
  const realId = spotify.songs[0].id;

  const ok = parseGenerateInput({ mode: "remix", sourceSongId: realId, genreId: "bollywood" }, spotify);
  assert.ok(ok.ok);
  if (ok.ok) assert.equal(titleFor(ok.input, spotify.songs[0].title, spotify), "Way Too Self Aware × Bollywood");

  assert.equal(parseGenerateInput({ mode: "remix", sourceSongId: realId, genreId: "bollywood" }, dummy).ok, false);
  assert.equal(parseGenerateInput({ mode: "remix", sourceSongId: "mock-track-01", genreId: "bollywood" }, spotify).ok, false);
  assert.ok(parseGenerateInput({ mode: "cover", sourceSongId: realId, singerId: "fred-again" }, spotify).ok);
  assert.equal(parseGenerateInput({ mode: "cover", sourceSongId: "mock-track-01", singerId: "frank-ocean" }, dummy).ok, false);
});
