import { MOCK_TASTE } from "./mock-taste";

// The 16 picker songs (02-01 / 02-03 / 02-05), in design order. Derived from
// MOCK_TASTE until milestone 7 reads the signed-in user's own taste.

export type Song = { id: string; title: string; artist: string };

export const SONGS: Song[] = MOCK_TASTE.topTracks.map((t) => ({ id: t.id, title: t.name, artist: t.artist }));

export function getSong(id: string): Song | undefined {
  return SONGS.find((s) => s.id === id);
}
