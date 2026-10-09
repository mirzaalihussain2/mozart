import type { ModeId } from "./modes";

// Mock generation catalogue (tech-spec §6): the prepared files in public/audio/,
// tagged with the option ids from genres.ts, singers.ts, themes.ts and
// ideas.ts. lib/server/generate/pick-audio.ts chooses from these.

export type AudioEntry = {
  id: string;
  /** Public URL, e.g. "/audio/bollywood-pop-01.mp3". */
  file: string;
  durationSec: number;
  modes: ModeId[];
  genres: string[];
  singers: string[];
  themes: string[];
  /** Free-text keywords for Vibe / Something new, plus idea ids. */
  moods: string[];
};

export const AUDIO_CATALOGUE: AudioEntry[] = [];

export function getAudioByFile(file: string): AudioEntry | undefined {
  return AUDIO_CATALOGUE.find((a) => a.file === file);
}
