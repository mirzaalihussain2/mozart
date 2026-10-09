import type { SpotifyTaste } from "../types/taste";
import { MOCK_TASTE } from "./mock-taste";

// The song picker (02-01 / 02-03 / 02-05): the viewer's top tracks, in
// order. Spotify users get their own (lib/server/taste.ts); everyone else
// MOCK_TASTE. Ids are Spotify track ids (or mock-track-NN).

export type Song = { id: string; title: string; artist: string };

export function songsFrom(taste: SpotifyTaste): Song[] {
  return taste.topTracks.map((t) => ({ id: t.id, title: t.name, artist: t.artist }));
}

/** The mock catalogue (dummy users, signed-out visitors, the gallery). */
export const SONGS: Song[] = songsFrom(MOCK_TASTE);

export function findSong(songs: Song[], id: string): Song | undefined {
  return songs.find((s) => s.id === id);
}

export function getSong(id: string): Song | undefined {
  return findSong(SONGS, id);
}
