// Derek ("Log in") and Candice (the Spotify fallback) for e2e tests: their
// songs by name, and the starter tracks every sign-in restores.
import { CANDICE, DEREK, type Persona } from "../../../lib/config/personas";

export { CANDICE, DEREK };

/** A persona's song id by title, e.g. songId(DEREK, "Latch"). */
export function songId(persona: Persona, title: string): string {
  const song = persona.spotifyTaste.topTracks.find((t) => t.name === title);
  if (!song) throw new Error(`${persona.firstName} has no song "${title}"`);
  return song.id;
}

/** Derek's starter tracks used by the tests (lib/config/personas.ts). */
export const DEREK_LATCH = { slug: "derek-latch-weeknd", title: "Latch × The Weeknd" }; // cover of a song, newest
export const DEREK_POP_PUNK = { slug: "derek-wanna-know-pop-punk", title: "Do I Wanna Know? × Pop punk" }; // remix of a starter (REMIX badge)
export const CANDICE_KILL_BILL = { slug: "candice-kill-bill-afrobeats", title: "Kill Bill × Afrobeats" };
