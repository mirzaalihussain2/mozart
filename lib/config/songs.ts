import type { SpotifyTaste } from "../types/taste";
import { MOCK_TASTE } from "./mock-taste";

// The song picker (02-01 / 02-03 / 02-05): the viewer's top tracks, in
// order. Spotify users get their own (lib/server/taste.ts); everyone else
// MOCK_TASTE. Ids are Spotify track ids (or mock-track-NN).

/** `imageUrl`: the album cover from Spotify; null (mock taste) shows initials. */
export type Song = { id: string; title: string; artist: string; imageUrl: string | null };

export function songsFrom(taste: SpotifyTaste): Song[] {
  return taste.topTracks.map((t) => ({ id: t.id, title: t.name, artist: t.artist, imageUrl: t.imageUrl ?? null }));
}

/** The mock catalogue (dummy users, signed-out visitors, the gallery). */
export const SONGS: Song[] = songsFrom(MOCK_TASTE);

export function findSong(songs: Song[], id: string): Song | undefined {
  return songs.find((s) => s.id === id);
}
