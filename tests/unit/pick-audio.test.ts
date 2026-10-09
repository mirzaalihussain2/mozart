// pnpm test:unit — mock audio choice (lib/server/generate/pick-audio.ts).
import assert from "node:assert/strict";
import { test } from "node:test";
import { AUDIO_CATALOGUE } from "../../lib/config/audio-catalogue";
import type { GenerateInput } from "../../lib/generation-input";
import { pickAudio } from "../../lib/server/generate/pick-audio";

const TRACK = "e56a3f29-d662-4e37-8952-a56d2c3f6a7e";

test("exact tag match: genre, singer, theme, idea", () => {
  assert.equal(pickAudio({ mode: "remix", sourceSongId: "mock-track-01", genreId: "bollywood" }).id, "bollywood-strings");
  assert.equal(pickAudio({ mode: "cover", sourceSongId: "mock-track-03", singerId: "kendrick-lamar" }).id, "drill-afrobeats");
  assert.equal(pickAudio({ mode: "rewrite", sourceSongId: "mock-track-07", themeId: "a-summer-roadtrip" }).id, "country-roadtrip");
  assert.equal(pickAudio({ mode: "new", text: "x", ideaId: "rainy-day-lofi" }).id, "acoustic-lofi");
});

test("free text matches keywords", () => {
  assert.equal(pickAudio({ mode: "vibe", sourceTrackId: TRACK, text: "Make it a stripped-back acoustic version for a rainy Sunday" }).id, "acoustic-lofi");
  assert.equal(pickAudio({ mode: "new", text: "A sad garage song about the night bus home" }).id, "late-night-garage");
});

test("deterministic: the same request always gets the same file", () => {
  const input: GenerateInput = { mode: "new", text: "something nobody tagged, like a kazoo quartet" };
  const first = pickAudio(input).id;
  for (let i = 0; i < 20; i++) assert.equal(pickAudio(input).id, first);
});

test("never the source track's own file when another option exists", () => {
  // Bollywood's only exact match is bollywood-strings; from a track already using it, pick something else.
  const input: GenerateInput = { mode: "remix", sourceTrackId: TRACK, genreId: "bollywood" };
  assert.notEqual(pickAudio(input, "/audio/bollywood-strings.mp3").file, "/audio/bollywood-strings.mp3");
  for (const a of AUDIO_CATALOGUE) {
    assert.notEqual(pickAudio({ mode: "vibe", sourceTrackId: TRACK, text: "anything at all" }, a.file).file, a.file);
  }
  // With only one file it has no choice.
  const only = [AUDIO_CATALOGUE[0]];
  assert.equal(pickAudio(input, only[0].file, only).file, only[0].file);
});

test("different choices sound different", () => {
  const files = new Set(
    ["electronic", "pop-punk", "bollywood", "drill", "country", "k-pop"].map(
      (genreId) => pickAudio({ mode: "remix", sourceSongId: "mock-track-01", genreId }).file,
    ),
  );
  assert.equal(files.size, 6);
});
