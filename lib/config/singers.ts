import { MOCK_TASTE } from "./mock-taste";

// Cover step 2 singers (CfCover2.dc.html), in design order. Derived from
// MOCK_TASTE.topArtists until milestone 7 reads the user's own taste.
// `id` (a slug of the name) is what the API and the audio catalogue use.

export type Singer = { id: string; name: string };

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const SINGERS: Singer[] = MOCK_TASTE.topArtists.map((a) => ({ id: slug(a.name), name: a.name }));

export function getSinger(id: string): Singer | undefined {
  return SINGERS.find((s) => s.id === id);
}
