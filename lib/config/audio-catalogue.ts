import type { ModeId } from "./modes";

// Mock generation catalogue: the prepared files in public/audio/,
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

// Eight placeholder recordings (re-encoded to 128 kbps MP3). They aren't
// really these styles; each is given a role so every genre, singer, theme
// and idea has at least one file, and different choices sound different.
// Singer tags cover the mock taste and Derek's and Candice's artists
// (lib/config/persona-tastes.ts); anyone else's singer gets a hashed pick.
export const AUDIO_CATALOGUE: AudioEntry[] = [
  {
    id: "bollywood-strings",
    file: "/audio/bollywood-strings.mp3",
    durationSec: 188,
    modes: ["remix", "cover", "rewrite", "vibe", "new"],
    genres: ["bollywood", "classical"],
    singers: ["arijit-singh", "diljit-dosanjh"],
    themes: ["falling-in-love", "missing-home"],
    moods: ["pop-punk-bollywood", "bollywood", "filmi", "strings", "romantic", "orchestral", "indian"],
  },
  {
    id: "acoustic-lofi",
    file: "/audio/acoustic-lofi.mp3",
    durationSec: 208,
    modes: ["remix", "cover", "rewrite", "vibe", "new"],
    genres: ["lo-fi", "jazz"],
    singers: ["billie-eilish", "bon-iver", "four-tet"],
    themes: ["missing-home", "self-love"],
    moods: ["rainy-day-lofi", "acoustic", "lofi", "rainy", "chill", "calm", "stripped", "sunday", "sad", "soft"],
  },
  {
    id: "electronic-dance",
    file: "/audio/electronic-dance.mp3",
    durationSec: 148,
    modes: ["remix", "cover", "rewrite", "vibe", "new"],
    genres: ["electronic", "disco"],
    singers: ["fred-again", "dua-lipa", "disclosure", "jamie-xx"],
    themes: ["a-night-out", "payday"],
    moods: ["euphoric-anthem", "euphoric", "dance", "club", "electronic", "edm", "anthem", "summer", "house"],
  },
  {
    id: "pop-punk-guitars",
    file: "/audio/pop-punk-guitars.mp3",
    durationSec: 152,
    modes: ["remix", "cover", "rewrite", "vibe", "new"],
    genres: ["pop-punk", "metal"],
    singers: ["arctic-monkeys", "fontaines-d-c", "olivia-rodrigo"],
    themes: ["heartbreak", "growing-up"],
    moods: ["punk", "rock", "guitar", "guitars", "loud", "angry", "breakup", "emo"],
  },
  {
    id: "drill-afrobeats",
    file: "/audio/drill-afrobeats.mp3",
    durationSec: 147,
    modes: ["remix", "cover", "rewrite", "vibe", "new"],
    genres: ["drill", "afrobeats"],
    singers: ["kendrick-lamar", "burna-boy", "tems"],
    themes: ["my-best-friends", "payday"],
    moods: ["rap", "hip hop", "drill", "grime", "bass", "afro", "trap"],
  },
  {
    id: "late-night-garage",
    file: "/audio/late-night-garage.mp3",
    durationSec: 163,
    modes: ["remix", "cover", "rewrite", "vibe", "new"],
    genres: [],
    singers: ["the-weeknd", "burial", "sza"],
    themes: ["a-night-out", "first-dates"],
    moods: ["late-night-garage", "garage", "uk garage", "night", "late", "bus", "r b", "rnb", "moody"],
  },
  {
    id: "country-roadtrip",
    file: "/audio/country-roadtrip.mp3",
    durationSec: 198,
    modes: ["remix", "cover", "rewrite", "vibe", "new"],
    genres: ["country"],
    singers: ["taylor-swift"],
    themes: ["a-summer-roadtrip", "moving-to-london"],
    moods: ["country", "folk", "storytelling", "roadtrip", "road trip", "banjo", "americana"],
  },
  {
    id: "cinematic-pop-ballad",
    file: "/audio/cinematic-pop-ballad.mp3",
    durationSec: 198,
    modes: ["remix", "cover", "rewrite", "vibe", "new"],
    genres: ["k-pop"],
    singers: ["sabrina-carpenter"],
    themes: ["falling-in-love", "self-love"],
    moods: ["pop", "ballad", "cinematic", "piano", "soaring", "love", "strings"],
  },
];

export function getAudioByFile(file: string): AudioEntry | undefined {
  return AUDIO_CATALOGUE.find((a) => a.file === file);
}
