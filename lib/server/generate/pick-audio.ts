import "server-only";
import { createHash } from "node:crypto";
import { AUDIO_CATALOGUE, type AudioEntry } from "@/lib/config/audio-catalogue";
import type { GenerateInput } from "@/lib/generation-input";

/**
 * Chooses the mock audio for a request:
 *   1. exact tag match on the mode + its choice (genre / singer / theme);
 *   2. for free text (Vibe, Something new), the best keyword match;
 *   3. otherwise a deterministic pick from the mode's files, then all files.
 * Never the source track's own file when another option exists. The same
 * request always gets the same file.
 */
export function pickAudio(input: GenerateInput, sourceFile?: string | null, catalogue: AudioEntry[] = AUDIO_CATALOGUE): AudioEntry {
  if (catalogue.length === 0) throw new Error("The audio catalogue is empty");
  const key = requestKey(input);
  const pick = (pool: AudioEntry[]) => pool[hashIndex(key, pool.length)];
  const notSource = (pool: AudioEntry[]) => pool.filter((a) => a.file !== sourceFile);

  const exact = notSource(exactMatches(input, catalogue));
  if (exact.length) return pick(exact);

  if (input.mode === "vibe" || input.mode === "new") {
    const keyword = notSource(keywordMatches(input, catalogue));
    if (keyword.length) return pick(keyword);
  }

  const sameMode = notSource(catalogue.filter((a) => a.modes.includes(input.mode)));
  if (sameMode.length) return pick(sameMode);
  const others = notSource(catalogue);
  return pick(others.length ? others : catalogue);
}

function exactMatches(input: GenerateInput, catalogue: AudioEntry[]): AudioEntry[] {
  switch (input.mode) {
    case "remix":
      return catalogue.filter((a) => a.genres.includes(input.genreId));
    case "cover":
      return catalogue.filter((a) => a.singers.includes(input.singerId));
    case "rewrite":
      return catalogue.filter((a) => a.themes.includes(input.themeId));
    case "new":
      return input.ideaId ? catalogue.filter((a) => a.moods.includes(input.ideaId!)) : [];
    case "vibe":
      return [];
  }
}

/** Entries sharing the most keywords with the free text (genres and moods). */
function keywordMatches(input: GenerateInput & { text: string }, catalogue: AudioEntry[]): AudioEntry[] {
  const text = ` ${input.text.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;
  const has = (tag: string) => text.includes(` ${tag.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `);
  let bestScore = 0;
  let best: AudioEntry[] = [];
  for (const a of catalogue) {
    const score = [...a.moods, ...a.genres].filter(has).length;
    if (score > bestScore) [bestScore, best] = [score, [a]];
    else if (score === bestScore && score > 0) best.push(a);
  }
  return best;
}

function requestKey(input: GenerateInput): string {
  return JSON.stringify(Object.entries(input).sort(([a], [b]) => a.localeCompare(b)));
}

function hashIndex(key: string, n: number): number {
  return createHash("sha256").update(key).digest().readUInt32BE(0) % n;
}
