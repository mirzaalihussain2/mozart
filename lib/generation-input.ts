// The POST /api/generate request body (tech-spec §4 generation_input), its
// validator and the track naming rule. Shared by client and server: no
// server imports here.

import { getGenre } from "./config/genres";
import { getIdea } from "./config/ideas";
import { getSinger } from "./config/singers";
import { getSong } from "./config/songs";
import { getTheme } from "./config/themes";

/** Made from a picked song (Create flow) or from an existing track (player). */
type Source = { sourceSongId: string; sourceTrackId?: undefined } | { sourceTrackId: string; sourceSongId?: undefined };

export type GenerateInput =
  | ({ mode: "remix"; genreId: string } & Source)
  | ({ mode: "cover"; singerId: string } & Source)
  | ({ mode: "rewrite"; themeId: string } & Source)
  | { mode: "vibe"; sourceTrackId: string; text: string }
  | { mode: "new"; text: string; ideaId?: string };

export const MAX_TEXT = 280;

export type ParseResult = { ok: true; input: GenerateInput } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

/** Validates an untrusted request body. Unknown fields are ignored. */
export function parseGenerateInput(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Expected a JSON object." };
  const b = body as Record<string, unknown>;
  const mode = b.mode;

  const source = (): { ok: true; source: Source } | { ok: false; error: string } => {
    const songId = str(b.sourceSongId);
    const trackId = str(b.sourceTrackId);
    if (songId && trackId) return { ok: false, error: "Send sourceSongId or sourceTrackId, not both." };
    if (songId) return getSong(songId) ? { ok: true, source: { sourceSongId: songId } } : { ok: false, error: "Unknown song." };
    if (trackId) return UUID.test(trackId) ? { ok: true, source: { sourceTrackId: trackId } } : { ok: false, error: "Invalid sourceTrackId." };
    return { ok: false, error: "A source song or track is required." };
  };

  const text = (): { ok: true; text: string } | { ok: false; error: string } => {
    const t = str(b.text)?.trim().replace(/\s+/g, " ");
    if (!t) return { ok: false, error: "Describe the song first." };
    if (t.length > MAX_TEXT) return { ok: false, error: `Keep it under ${MAX_TEXT} characters.` };
    return { ok: true, text: t };
  };

  switch (mode) {
    case "remix":
    case "cover":
    case "rewrite": {
      const s = source();
      if (!s.ok) return s;
      if (mode === "remix") {
        const genreId = str(b.genreId) ?? "";
        return getGenre(genreId) ? { ok: true, input: { mode, genreId, ...s.source } } : { ok: false, error: "Unknown genre." };
      }
      if (mode === "cover") {
        const singerId = str(b.singerId) ?? "";
        return getSinger(singerId) ? { ok: true, input: { mode, singerId, ...s.source } } : { ok: false, error: "Unknown singer." };
      }
      const themeId = str(b.themeId) ?? "";
      return getTheme(themeId) ? { ok: true, input: { mode, themeId, ...s.source } } : { ok: false, error: "Unknown theme." };
    }
    case "vibe": {
      const trackId = str(b.sourceTrackId);
      if (!trackId || !UUID.test(trackId)) return { ok: false, error: "Vibe needs a source track." };
      const t = text();
      return t.ok ? { ok: true, input: { mode, sourceTrackId: trackId, text: t.text } } : t;
    }
    case "new": {
      const ideaId = str(b.ideaId);
      if (ideaId && !getIdea(ideaId)) return { ok: false, error: "Unknown idea." };
      const t = text();
      return t.ok ? { ok: true, input: { mode, text: t.text, ...(ideaId ? { ideaId } : {}) } } : t;
    }
    default:
      return { ok: false, error: "Unknown mode." };
  }
}

/** The change in "{root} × {change}" — or the whole title for Something new. */
export function changeLabel(input: GenerateInput): string {
  switch (input.mode) {
    case "remix":
      return getGenre(input.genreId)!.name;
    case "cover":
      return getSinger(input.singerId)!.name;
    case "rewrite":
      return getTheme(input.themeId)!.label;
    case "vibe":
      return sentenceCase(trimWords(input.text, 24));
    case "new": {
      const idea = input.ideaId ? getIdea(input.ideaId) : undefined;
      // An idea's label only when the text is still that idea, untouched.
      return idea && idea.text === input.text ? idea.label : sentenceCase(trimWords(input.text, 32));
    }
  }
}

/**
 * Track naming rule (AGENTS.md §3): `{root original song} × {change}`, always
 * the root song so a chain never gets a double ×. `new` has no root: the
 * idea's label or the trimmed text.
 */
export function titleFor(input: GenerateInput, root: string | null): string {
  const change = changeLabel(input);
  return input.mode === "new" || !root ? change : `${root} × ${change}`;
}

// Words a cut title shouldn't end on ("A sad garage song about the").
const DANGLING = new Set(["a", "an", "the", "of", "for", "about", "to", "and", "or", "with", "in", "on", "at", "by", "from", "but", "my", "your"]);

/**
 * Trims to at most `max` characters at a word boundary, without trailing
 * punctuation or (when cut) a dangling small word.
 */
export function trimWords(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, " ");
  const strip = (s: string) => s.replace(/[\s.,;:!?…—–-]+$/u, "");
  if (clean.length <= max) return strip(clean);
  const cut = clean.slice(0, max + 1);
  const space = cut.lastIndexOf(" ");
  if (space <= 0) return strip(clean.slice(0, max));
  const words = strip(cut.slice(0, space)).split(" ");
  while (words.length > 1 && DANGLING.has(words[words.length - 1].toLowerCase())) words.pop();
  return strip(words.join(" "));
}

/** Capitalises the first letter only, so names like "London" stay as typed. */
export function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
