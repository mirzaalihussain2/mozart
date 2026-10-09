import type { SpotifyTaste } from "../types/taste";
import { MOCK_TASTE } from "./mock-taste";

// Cover step 2 singers (CfCover2): the viewer's top artists, in order.
// `id` is a slug of the name (stable across Spotify and mock taste, and what
// the audio catalogue tags use).

/** `imageUrl`: the artist photo from Spotify; null (mock taste) shows initials. */
export type Singer = { id: string; name: string; imageUrl: string | null };

const slug = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function singersFrom(taste: SpotifyTaste): Singer[] {
  const seen = new Set<string>();
  return taste.topArtists
    .map((a) => ({ id: slug(a.name) || a.id, name: a.name, imageUrl: a.imageUrl ?? null }))
    .filter((s) => !seen.has(s.id) && seen.add(s.id));
}

/** The mock list (dummy users, signed-out visitors, the gallery). */
export const SINGERS: Singer[] = singersFrom(MOCK_TASTE);

export function findSinger(singers: Singer[], id: string): Singer | undefined {
  return singers.find((s) => s.id === id);
}
