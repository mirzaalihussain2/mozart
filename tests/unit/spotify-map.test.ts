// pnpm test:unit — Spotify → taste mapping (lib/spotify/map-taste.ts), against the real fixtures.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { cleanTrackName, firstNameFrom, mapArtists, mapProfile, mapTaste, mapTracks, MAX_ARTISTS, MAX_TRACKS } from "../../lib/spotify/map-taste";
import type { SpotifyArtist, SpotifyPage, SpotifyProfile, SpotifyTrack } from "../../lib/spotify/types";

const fixture = <T>(name: string): T => JSON.parse(readFileSync(`docs/fixtures/spotify/${name}.json`, "utf8")) as T;
const tracks = fixture<SpotifyPage<SpotifyTrack>>("top-tracks").items;
const artists = fixture<SpotifyPage<SpotifyArtist>>("top-artists").items;
const me = fixture<SpotifyProfile>("me");

test("track names lose version suffixes and featured artists", () => {
  assert.equal(cleanTrackName("Blackbird - Remastered 2009"), "Blackbird");
  assert.equal(cleanTrackName("lovely (with Khalid)"), "lovely");
  assert.equal(cleanTrackName('Kesariya (From "Brahmastra")'), "Kesariya");
  assert.equal(cleanTrackName("Beggin - Original Version"), "Beggin");
  assert.equal(cleanTrackName("Down Under (feat. Colin Hay)"), "Down Under");
  assert.equal(cleanTrackName("Where Are Ü Now (with Justin Bieber) - Ember Island Remix"), "Where Are Ü Now");
  assert.equal(cleanTrackName("Mykonos - feat. Fleet Foxes"), "Mykonos");
  assert.equal(cleanTrackName("3 2 1"), "3 2 1");
  // Every fixture name the mapper keeps is clean.
  for (const t of mapTracks(tracks)) assert.doesNotMatch(t.name, /remaster|\(feat|\(with| - .*remix/i, t.name);
});

test("tracks: de-duplicated, Spotify order kept, first artist, album image near 300 px, capped", () => {
  // The fixture lists "FIRE ON FIRE DRILL" twice (items 29 and 31, different ids).
  assert.equal(mapTracks(tracks, 100).filter((t) => t.name === "FIRE ON FIRE DRILL").length, 1);
  assert.equal(mapTracks(tracks, 100).length, tracks.length - 1);
  const mapped = mapTracks(tracks);
  assert.equal(mapped[0].name, "Way Too Self Aware");
  assert.equal(mapped[0].artist, "Ian Asher");
  assert.deepEqual(mapped[0].artists, tracks[0].artists.map((a) => a.name));
  assert.match(mapped[0].imageUrl ?? "", /^https:\/\/i\.scdn\.co\//);
  assert.equal(mapped.length, MAX_TRACKS);
  // Order follows the first appearance in Spotify's list.
  const firstSeen = mapped.map((m) => tracks.findIndex((t) => t.id === m.id));
  assert.deepEqual(firstSeen, [...firstSeen].sort((a, b) => a - b));
  assert.ok(mapped.some((t) => t.name === "Blackbird" && t.artist === "The Beatles"));
});

test("artists: id, name, image; capped at 12", () => {
  const mapped = mapArtists(artists);
  assert.equal(mapped.length, MAX_ARTISTS);
  assert.deepEqual(Object.keys(mapped[0]).sort(), ["id", "imageUrl", "name"]);
  assert.equal(mapped[0].name, "Fred again..");
  assert.ok(mapped.every((a) => a.imageUrl));
});

test("genres are always empty", () => {
  assert.deepEqual(mapTaste(tracks, artists).genres, []);
});

test("first names and the profile", () => {
  assert.equal(firstNameFrom("ali"), "Ali");
  assert.equal(firstNameFrom("jane doe"), "Jane");
  assert.equal(firstNameFrom(""), "Friend");
  assert.equal(firstNameFrom("   "), "Friend");
  assert.equal(firstNameFrom(null), "Friend");
  assert.deepEqual(mapProfile(me), {
    spotifyUserId: "mozart-fixture-user",
    displayName: "ali",
    firstName: "Ali",
    avatarUrl: "https://i.scdn.co/image/fixture-avatar-300",
  });
});
