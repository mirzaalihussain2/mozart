import { MOCK_TASTE } from "./mock-taste";

// Cover step 2 singers (CfCover2.dc.html), in design order. Derived from
// MOCK_TASTE.topArtists until milestone 7 reads the user's own taste.

export const SINGERS: string[] = MOCK_TASTE.topArtists.map((a) => a.name);
