// pnpm personas:tastes — looks up Derek's and Candice's top songs and artists
// on Spotify (client credentials: Search only) and writes
// lib/config/persona-tastes.ts with real ids, album covers and artist photos,
// mapped exactly as a real sign-in maps them (lib/spotify/map-taste.ts).
// Edit the lists below, re-run, and review the diff. Needs SPOTIFY_CLIENT_ID /
// SPOTIFY_CLIENT_SECRET in .env.local.
import { config } from "dotenv";
import { writeFile } from "node:fs/promises";
import { mapArtists, mapTracks } from "../lib/spotify/map-taste";
import type { SpotifyArtist, SpotifyTrack } from "../lib/spotify/types";
import type { SpotifyTaste } from "../lib/types/taste";

config({ path: ".env.local", quiet: true });

type PersonaSpec = { name: string; genres: string[]; tracks: [title: string, artist: string][]; artists: string[] };

// Each list is in "top" order. Artists are chosen to line up with the audio
// catalogue's singer tags (lib/config/audio-catalogue.ts), so covers land on
// a file that suits them.
const PERSONAS: Record<"derek" | "candice", PersonaSpec> = {
  // Indie, electronic and UK garage.
  derek: {
    name: "Derek",
    genres: ["uk garage", "electronic", "house", "indie rock", "indie folk"],
    tracks: [
      ["Delilah (pull me out of this)", "Fred again.."],
      ["Latch", "Disclosure"],
      ["Do I Wanna Know?", "Arctic Monkeys"],
      ["Gosh", "Jamie xx"],
      ["Holocene", "Bon Iver"],
      ["Archangel", "Burial"],
      ["Boys in the Better Land", "Fontaines D.C."],
      ["Marea (we've lost dancing)", "Fred again.."],
      ["505", "Arctic Monkeys"],
      ["Loud Places", "Jamie xx"],
      ["Skinny Love", "Bon Iver"],
      ["White Noise", "Disclosure"],
      ["Blinding Lights", "The Weeknd"],
      ["Starburster", "Fontaines D.C."],
      ["LUNCH", "Billie Eilish"],
      ["Baby", "Four Tet"],
      ["Mardy Bum", "Arctic Monkeys"],
      ["Untrue", "Burial"],
      ["Rumble", "Fred again.."],
      ["Wildfire", "SBTRKT"],
    ],
    artists: ["Fred again..", "Arctic Monkeys", "Disclosure", "Jamie xx", "Bon Iver", "Burial", "Fontaines D.C.", "The Weeknd", "Billie Eilish", "Four Tet"],
  },
  // Pop, R&B, Bollywood and Afrobeats.
  candice: {
    name: "Candice",
    genres: ["pop", "r&b", "afrobeats", "filmi", "punjabi pop"],
    tracks: [
      ["Kill Bill", "SZA"],
      ["Last Last", "Burna Boy"],
      ["Kesariya", "Arijit Singh"],
      ["Espresso", "Sabrina Carpenter"],
      ["Cruel Summer", "Taylor Swift"],
      ["Free Mind", "Tems"],
      ["Levitating", "Dua Lipa"],
      ["Lover", "Diljit Dosanjh"],
      ["good 4 u", "Olivia Rodrigo"],
      ["Snooze", "SZA"],
      ["Tum Hi Ho", "Arijit Singh"],
      ["Essence", "Wizkid"],
      ["Please Please Please", "Sabrina Carpenter"],
      ["Anti-Hero", "Taylor Swift"],
      ["Houdini", "Dua Lipa"],
      ["City Boys", "Burna Boy"],
      ["Born to Shine", "Diljit Dosanjh"],
      ["drivers license", "Olivia Rodrigo"],
      ["Not Like Us", "Kendrick Lamar"],
      ["Saturn", "SZA"],
    ],
    artists: ["SZA", "Taylor Swift", "Arijit Singh", "Burna Boy", "Sabrina Carpenter", "Dua Lipa", "Tems", "Diljit Dosanjh", "Olivia Rodrigo", "Kendrick Lamar"],
  },
};

async function token(): Promise<string> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET are not set (.env.local)");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Spotify token: ${res.status}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");

async function search<T>(accessToken: string, q: string, type: "track" | "artist"): Promise<T[]> {
  const url = `https://api.spotify.com/v1/search?${new URLSearchParams({ q, type, limit: "10" })}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Spotify search "${q}": ${res.status}`);
  const body = (await res.json()) as Record<string, { items: T[] }>;
  return body[`${type}s`].items;
}

async function tasteFor(accessToken: string, spec: PersonaSpec): Promise<SpotifyTaste> {
  const tracks: SpotifyTrack[] = [];
  for (const [title, artist] of spec.tracks) {
    const items = await search<SpotifyTrack>(accessToken, `track:${title} artist:${artist}`, "track");
    // The first result by that artist whose name starts with the title (skips covers and remixes).
    const hit = items.find((t) => t.artists.some((a) => norm(a.name) === norm(artist)) && norm(t.name).startsWith(norm(title)));
    if (!hit) throw new Error(`${spec.name}: no Spotify match for "${title}" by ${artist}`);
    // List the artist we asked for first (Spotify may lead with a composer or collaborator).
    const lead = hit.artists.filter((a) => norm(a.name) === norm(artist));
    tracks.push({ ...hit, artists: [...lead, ...hit.artists.filter((a) => !lead.includes(a))] });
  }
  const artists: SpotifyArtist[] = [];
  for (const name of spec.artists) {
    const hit = (await search<SpotifyArtist>(accessToken, name, "artist")).find((a) => norm(a.name) === norm(name));
    if (!hit) throw new Error(`${spec.name}: no Spotify artist "${name}"`);
    artists.push(hit);
  }
  const topTracks = mapTracks(tracks);
  const topArtists = mapArtists(artists);
  for (const t of topTracks) if (!t.imageUrl) console.warn(`${spec.name}: no cover for ${t.name}`);
  for (const a of topArtists) if (!a.imageUrl) console.warn(`${spec.name}: no photo for ${a.name}`);
  return { topTracks, topArtists, genres: spec.genres };
}

async function main() {
  const accessToken = await token();
  const derek = await tasteFor(accessToken, PERSONAS.derek);
  const candice = await tasteFor(accessToken, PERSONAS.candice);
  const out = `// Generated by scripts/persona-tastes.ts (pnpm personas:tastes) — edit the
// lists there and re-run; don't edit by hand. Derek's and Candice's Spotify
// tastes: real track/artist ids, album covers and artist photos (Spotify CDN).
import type { SpotifyTaste } from "../types/taste";

export const DEREK_TASTE: SpotifyTaste = ${JSON.stringify(derek, null, 2)};

export const CANDICE_TASTE: SpotifyTaste = ${JSON.stringify(candice, null, 2)};
`;
  await writeFile("lib/config/persona-tastes.ts", out);
  console.log(`Wrote lib/config/persona-tastes.ts: Derek ${derek.topTracks.length} songs / ${derek.topArtists.length} artists, Candice ${candice.topTracks.length} / ${candice.topArtists.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
