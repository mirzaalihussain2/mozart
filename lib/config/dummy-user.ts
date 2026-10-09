import { MOCK_TASTE } from "./mock-taste";

// Dummy sign-in personas (fixed ids, upserted on sign-in and by the seed).
// Ali is the "Log in" user and the creator in the demo; Sam is who a friend
// becomes when signing in from someone else's track. Real Spotify (milestone
// 7) replaces this for allowlisted accounts.
export const DUMMY_USER = {
  id: "e56a3f29-d662-4e37-8952-a56d2c3f6a7e",
  displayName: "Ali",
  firstName: "Ali",
  avatarUrl: null,
  authProvider: "dummy",
  spotifyTaste: MOCK_TASTE,
} as const;

export const SAM_USER = {
  id: "ac3e2fb0-0148-4109-969c-39b73bf36d5d",
  displayName: "Sam",
  firstName: "Sam",
  avatarUrl: null,
  authProvider: "dummy",
  spotifyTaste: MOCK_TASTE,
} as const;

export type Persona = typeof DUMMY_USER | typeof SAM_USER;

/** In order: sign-in picks the first one who isn't the owner of the track being signed in from. */
export const PERSONAS: readonly Persona[] = [DUMMY_USER, SAM_USER];

// Ali's library (07-01), newest first. `ageMinutes` is relative to seeding time
// so the dates read "Today", "Today", "Yesterday", then older (3 Oct, 1 Oct and
// 28 Sep when seeded on 9 Oct). `source` is the slug of the track it was made from.
export type SeedTrack = {
  publicSlug: string;
  mode: "remix" | "cover" | "rewrite" | "vibe" | "new";
  title: string;
  generationInput: Record<string, string>;
  /** Catalogue id (lib/config/audio-catalogue.ts). */
  audio: string;
  source?: string;
  ageMinutes: number;
};

const DAY = 24 * 60;

export const SEED_TRACKS: SeedTrack[] = [
  {
    publicSlug: "cruel-bolly",
    mode: "remix",
    title: "Cruel Summer × Bollywood",
    generationInput: { sourceSongId: "mock-track-01", genreId: "bollywood", rootSong: "Cruel Summer", rootArtist: "Taylor Swift", label: "Bollywood" },
    audio: "bollywood-strings",
    ageMinutes: 1,
  },
  {
    publicSlug: "cruel-electro",
    mode: "remix",
    title: "Cruel Summer × Electronic",
    generationInput: { genreId: "electronic", rootSong: "Cruel Summer", rootArtist: "Taylor Swift", label: "Electronic" },
    audio: "electronic-dance",
    source: "cruel-bolly",
    ageMinutes: 2,
  },
  {
    publicSlug: "deep-bolly",
    mode: "cover",
    title: "In Too Deep × Bollywood",
    generationInput: { sourceSongId: "mock-track-03", singerId: "arijit-singh", rootSong: "In Too Deep", rootArtist: "Sum 41", label: "Bollywood" },
    audio: "bollywood-strings",
    ageMinutes: DAY,
  },
  {
    publicSlug: "euphoric-pop",
    mode: "new",
    title: "Euphoric electronic pop",
    generationInput: {
      text: "A euphoric Fred again..-style anthem about a summer that ended too soon",
      ideaId: "euphoric-anthem",
      label: "Euphoric electronic pop",
    },
    audio: "electronic-dance",
    ageMinutes: 6 * DAY,
  },
  {
    publicSlug: "cinematic-pop",
    mode: "new",
    title: "Cinematic pop",
    generationInput: { text: "A cinematic pop ballad with soaring strings", label: "Cinematic pop" },
    audio: "cinematic-pop-ballad",
    ageMinutes: 8 * DAY,
  },
  {
    publicSlug: "deep-lofi",
    mode: "remix",
    title: "In Too Deep × Lo-fi",
    generationInput: { genreId: "lo-fi", rootSong: "In Too Deep", rootArtist: "Sum 41", label: "Lo-fi" },
    audio: "acoustic-lofi",
    source: "deep-bolly",
    ageMinutes: 11 * DAY,
  },
];
