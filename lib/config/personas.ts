import type { GenerateInput } from "../generation-input";
import type { SpotifyTaste } from "../types/taste";
import { CANDICE_TASTE, DEREK_TASTE } from "./persona-tastes";

// The two demo users (fixed ids, upserted on every sign-in). Only their data is
// fake: real Spotify users start with an empty library and keep it.
// - Derek: "Log in" on the landing page. Indie, electronic and UK garage.
// - Candice: every Spotify failure (cancel, not allowlisted, rate limit,
//   timeout, previews) — unless the track being signed in from is hers, then
//   Derek, so nobody "sends to" themselves. Pop, R&B, Bollywood and Afrobeats.
// Their tastes (real Spotify ids, covers and photos) come from
// scripts/persona-tastes.ts. Each sign-in resets their library to the starter
// tracks below (lib/server/auth/personas.ts).

export type Persona = {
  id: string;
  displayName: string;
  firstName: string;
  avatarUrl: string | null;
  authProvider: "dummy";
  spotifyTaste: SpotifyTaste;
};

export const DEREK: Persona = {
  id: "8d4f1e2a-6b3c-4f7e-9a10-5c2d7e8f9b01",
  displayName: "Derek",
  firstName: "Derek",
  avatarUrl: null,
  authProvider: "dummy",
  spotifyTaste: DEREK_TASTE,
};

export const CANDICE: Persona = {
  id: "3a7c9e15-2d4b-4c6f-8e01-b9f2a6d4c702",
  displayName: "Candice",
  firstName: "Candice",
  avatarUrl: null,
  authProvider: "dummy",
  spotifyTaste: CANDICE_TASTE,
};

export const PERSONAS: readonly Persona[] = [DEREK, CANDICE];

/** Who a failed Spotify sign-in becomes: the first one who doesn't own the track being signed in from. */
export const FALLBACK_ORDER: readonly Persona[] = [CANDICE, DEREK];

/**
 * A starter track, as the request that would have made it. Title, label and
 * audio are worked out at reset by the real generation code, so they always
 * follow the naming rule and the audio catalogue. `song` is a title from the
 * persona's top tracks; `source` is the slug of the starter it was made from.
 */
export type StarterTrack = {
  slug: string;
  ageMinutes: number;
} & (
  | { song: string; change: { mode: "remix"; genreId: string } | { mode: "cover"; singerId: string } | { mode: "rewrite"; themeId: string } }
  | { source: string; change: { mode: "remix"; genreId: string } | { mode: "cover"; singerId: string } | { mode: "rewrite"; themeId: string } }
  | { change: Extract<GenerateInput, { mode: "new" }> }
);

const HOUR = 60;
const DAY = 24 * HOUR;

// Newest first; sources before the tracks made from them.
export const STARTER_TRACKS: Record<string, StarterTrack[]> = {
  [DEREK.id]: [
    { slug: "derek-latch-weeknd", ageMinutes: 5, song: "Latch", change: { mode: "cover", singerId: "the-weeknd" } },
    { slug: "derek-wanna-know-electronic", ageMinutes: 3 * HOUR, song: "Do I Wanna Know?", change: { mode: "remix", genreId: "electronic" } },
    { slug: "derek-wanna-know-pop-punk", ageMinutes: DAY, source: "derek-wanna-know-electronic", change: { mode: "remix", genreId: "pop-punk" } },
    { slug: "derek-holocene-lofi", ageMinutes: 3 * DAY, song: "Holocene", change: { mode: "remix", genreId: "lo-fi" } },
    { slug: "derek-505-best-friends", ageMinutes: 6 * DAY, song: "505", change: { mode: "rewrite", themeId: "my-best-friends" } },
    { slug: "derek-night-bus-garage", ageMinutes: 10 * DAY, change: { mode: "new", text: "A late-night garage track for the night bus home" } },
  ],
  [CANDICE.id]: [
    { slug: "candice-kill-bill-afrobeats", ageMinutes: 10, song: "Kill Bill", change: { mode: "remix", genreId: "afrobeats" } },
    { slug: "candice-kill-bill-arijit", ageMinutes: DAY, source: "candice-kill-bill-afrobeats", change: { mode: "cover", singerId: "arijit-singh" } },
    { slug: "candice-espresso-disco", ageMinutes: 2 * DAY, song: "Espresso", change: { mode: "remix", genreId: "disco" } },
    { slug: "candice-cruel-summer-london", ageMinutes: 4 * DAY, song: "Cruel Summer", change: { mode: "rewrite", themeId: "moving-to-london" } },
    { slug: "candice-snooze-first-dates", ageMinutes: 7 * DAY, song: "Snooze", change: { mode: "rewrite", themeId: "first-dates" } },
    { slug: "candice-lagos-ballad", ageMinutes: 12 * DAY, change: { mode: "new", text: "A cinematic pop ballad about falling for someone in Lagos" } },
  ],
};

/** Every starter slug (tests never delete these). */
export const STARTER_SLUGS: string[] = Object.values(STARTER_TRACKS).flatMap((list) => list.map((t) => t.slug));
