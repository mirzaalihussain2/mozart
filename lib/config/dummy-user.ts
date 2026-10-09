import { MOCK_TASTE } from "./mock-taste";

// The predefined "Log in" user, also the silent fallback when Spotify fails.
// Fixed id so seeding and /auth/dummy upsert the same row.
export const DUMMY_USER = {
  id: "e56a3f29-d662-4e37-8952-a56d2c3f6a7e",
  displayName: "Ali",
  firstName: "Ali",
  avatarUrl: null,
  authProvider: "dummy",
  spotifyTaste: MOCK_TASTE,
} as const;

// Seed track owned by the dummy user (shown in the Library and the player designs).
export const SEED_TRACK = {
  publicSlug: "cruel-bolly",
  mode: "remix",
  title: "Cruel Summer × Bollywood",
  audioUrl: "/audio/placeholder.mp3",
  artworkUrl: null,
  generationInput: { sourceSong: "Cruel Summer", sourceArtist: "Taylor Swift", genre: "Bollywood" },
} as const;
