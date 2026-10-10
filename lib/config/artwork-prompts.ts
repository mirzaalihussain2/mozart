// Album art prompts for generated tracks (lib/server/artwork/). One template
// per mode, each changing something different, so the same song comes out
// meaningfully different per mode:
//   remix   same subject, new style (the genre's look)
//   cover   a new artist is the star
//   rewrite same style, new subject (the theme)
//   vibe    the free text decides how far it moves
//   new     from scratch, text only
// With the original song's cover (and, for Cover, the singer's photo) the
// image + text model reinterprets them; without, the text-only model works
// from the words. Shared by client and server: no server imports here.

import { getGenre } from "./genres";
import { getTheme } from "./themes";

/** What each genre looks like on a cover. Every id in GENRES has one. */
export const GENRE_LOOKS: Record<string, string> = {
  electronic: "neon light trails, glowing synth waveforms, deep blue and magenta, club haze and lasers",
  "pop-punk": "sun-bleached skate-park energy, torn paper and xerox textures, hot pink and black, scribbled marker",
  bollywood: "rich jewel tones, marigold garlands, gold ornament and hand-painted vintage film-poster style",
  drill: "dark, grainy night-time city streets, cold blue streetlight, hard shadows, gritty and minimal",
  jazz: "smoky late-night club, warm amber light, brushed brass, mid-century Blue Note-style photography",
  country: "golden-hour open road, dusty fields, denim and worn leather, warm sepia film photograph",
  "lo-fi": "soft pastel anime-style illustration, rainy window, cosy desk lamp glow, gentle film grain",
  metal: "dramatic black and silver, stormy skies, jagged etched illustration, fire and smoke",
  afrobeats: "vibrant sunlit colour, bold West African wax-print patterns, warm oranges and greens, joyful movement",
  classical: "elegant oil painting, candlelit concert hall, deep velvet reds and gold leaf, timeless and grand",
  "k-pop": "glossy high-fashion photo shoot, candy pastel colours, sparkles and holographic shine",
  disco: "mirror balls and glitter, purple and gold light beams, 1970s glamour, dance-floor glow",
};

const RULES = "Square album cover art. No text, letters, words, logos or watermarks.";

/** The images a prompt refers to, in the order they're sent. */
export type ArtworkImage = "cover" | "singer";

export type ArtworkPrompt = { prompt: string; images: ArtworkImage[] };

/** Everything the templates need, resolved from the request by the server. */
export type ArtworkBrief =
  | { mode: "remix"; song: string; artist: string; genreId: string; cover: boolean }
  | { mode: "cover"; song: string; artist: string; singer: string; cover: boolean; singerPhoto: boolean }
  | { mode: "rewrite"; song: string; artist: string; themeId: string; cover: boolean }
  | { mode: "vibe"; song: string; artist: string; text: string; cover: boolean }
  | { mode: "new"; text: string };

const songBy = (song: string, artist: string) => (artist ? `"${song}" by ${artist}` : `"${song}"`);

export function artworkPrompt(brief: ArtworkBrief): ArtworkPrompt {
  switch (brief.mode) {
    case "remix": {
      const genre = getGenre(brief.genreId)?.name ?? brief.genreId;
      const look = GENRE_LOOKS[brief.genreId] ?? `the visual style of ${genre} music`;
      const of = `a ${genre} remix of ${songBy(brief.song, brief.artist)}`;
      return brief.cover
        ? {
            prompt: `Reimagine this album cover for ${of}. Keep its main subject and composition recognisable, but restyle everything as ${genre}: ${look}. ${RULES}`,
            images: ["cover"],
          }
        : { prompt: `Album cover for ${of}, in the style of ${genre}: ${look}. ${RULES}`, images: [] };
    }
    case "cover": {
      const of = `${brief.singer}'s cover version of ${songBy(brief.song, brief.artist)}`;
      if (brief.cover && brief.singerPhoto) {
        return {
          prompt: `Album cover for ${of}. Make the person in the second image the star of the cover, as the artist singing it, in the mood, colour palette and setting of the first image (the original cover). Leave out any people from the original cover. ${RULES}`,
          images: ["cover", "singer"],
        };
      }
      if (brief.singerPhoto) {
        return {
          prompt: `Album cover for ${of}. Make the person in this image the star of the cover, as the artist singing it, in a striking portrait with a mood that suits the song. ${RULES}`,
          images: ["singer"],
        };
      }
      if (brief.cover) {
        return {
          prompt: `Reimagine this album cover for ${of}. Replace any people on it with ${brief.singer} as the artist singing it; keep the original's mood and colour palette. ${RULES}`,
          images: ["cover"],
        };
      }
      return { prompt: `Album cover for ${of}: a striking portrait of ${brief.singer} as the artist singing it. ${RULES}`, images: [] };
    }
    case "rewrite": {
      const about = getTheme(brief.themeId)?.phrase ?? brief.themeId;
      const song = songBy(brief.song, brief.artist);
      return brief.cover
        ? {
            prompt: `This is the album cover of ${song}. The song has been rewritten to be about ${about}. Keep the cover's art style, colour palette and composition so it reads as the same song, but replace its scene and subject with an image about ${about}. ${RULES}`,
            images: ["cover"],
          }
        : { prompt: `Album cover for a version of ${song} rewritten to be about ${about}: an evocative scene about ${about}. ${RULES}`, images: [] };
    }
    case "vibe": {
      const song = songBy(brief.song, brief.artist);
      return brief.cover
        ? {
            prompt: `This is the album cover of ${song}. The song has been changed: "${brief.text}". Reinterpret the cover to match that change, altering its style, subject or mood as much as the change asks for, while keeping a hint of the original. ${RULES}`,
            images: ["cover"],
          }
        : { prompt: `Album cover for a version of ${song} changed like this: "${brief.text}". Capture that change in one striking image. ${RULES}`, images: [] };
    }
    case "new":
      return { prompt: `Album cover art for a new song: "${brief.text}". Capture its genre, mood and story in one striking image. ${RULES}`, images: [] };
  }
}
