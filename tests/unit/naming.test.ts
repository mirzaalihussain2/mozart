// pnpm test:unit — naming rule and request validation (lib/generation-input.ts).
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseGenerateInput, titleFor, trimWords, type GenerateInput } from "../../lib/generation-input";

const TRACK_ID = "e56a3f29-d662-4e37-8952-a56d2c3f6a7e";
const parse = (body: unknown): GenerateInput => {
  const r = parseGenerateInput(body);
  assert.ok(r.ok, r.ok ? "" : r.error);
  return r.input;
};

test("direct from a song: {song} × {change}", () => {
  assert.equal(titleFor(parse({ mode: "remix", sourceSongId: "mock-track-01", genreId: "bollywood" }), "Cruel Summer"), "Cruel Summer × Bollywood");
  assert.equal(titleFor(parse({ mode: "cover", sourceSongId: "mock-track-03", singerId: "arijit-singh" }), "In Too Deep"), "In Too Deep × Arijit Singh");
  assert.equal(titleFor(parse({ mode: "rewrite", sourceSongId: "mock-track-07", themeId: "moving-to-london" }), "Payphone"), "Payphone × Moving to London");
});

test("from a track, and down a chain of three: always the root song, never a double ×", () => {
  // Cruel Summer × Bollywood → remix → Cruel Summer × Electronic → cover → Cruel Summer × Arijit Singh
  const root = "Cruel Summer";
  const electronic = titleFor(parse({ mode: "remix", sourceTrackId: TRACK_ID, genreId: "electronic" }), root);
  assert.equal(electronic, "Cruel Summer × Electronic");
  const cover = titleFor(parse({ mode: "cover", sourceTrackId: TRACK_ID, singerId: "arijit-singh" }), root);
  assert.equal(cover, "Cruel Summer × Arijit Singh");
  const rewrite = titleFor(parse({ mode: "rewrite", sourceTrackId: TRACK_ID, themeId: "heartbreak" }), root);
  assert.equal(rewrite, "Cruel Summer × Heartbreak");
  for (const t of [electronic, cover, rewrite]) assert.equal(t.split("×").length, 2, t);
});

test("vibe free text: trimmed to ~24 chars at a word boundary, sentence case", () => {
  const input = parse({ mode: "vibe", sourceTrackId: TRACK_ID, text: "make it a stripped-back acoustic version for a rainy Sunday" });
  assert.equal(titleFor(input, "Cruel Summer"), "Cruel Summer × Make it a stripped-back");
});

test("something new from an idea chip uses the idea's label", () => {
  const text = "A euphoric Fred again..-style anthem about a summer that ended too soon";
  assert.equal(titleFor(parse({ mode: "new", text, ideaId: "euphoric-anthem" }), null), "Euphoric electronic pop");
});

test("something new free text: trimmed to ~32 chars, sentence case, names kept", () => {
  assert.equal(titleFor(parse({ mode: "new", text: "a sad garage song about the night bus home" }), null), "A sad garage song");
  assert.equal(titleFor(parse({ mode: "new", text: "moving to London" }), null), "Moving to London");
  // Edited idea text no longer counts as the idea.
  assert.equal(titleFor(parse({ mode: "new", text: "Rainy-day lo-fi about Leeds", ideaId: "rainy-day-lofi" }), null), "Rainy-day lo-fi about Leeds");
});

test("long text: one long word is hard-cut, trailing punctuation dropped", () => {
  assert.equal(trimWords("Supercalifragilisticexpialidocious-ness", 24), "Supercalifragilisticexpi");
  assert.equal(trimWords("Short and sweet.", 24), "Short and sweet");
  assert.equal(trimWords("One two three, four five six seven", 14), "One two three");
  assert.equal(trimWords("Late night songs for the bus home", 20), "Late night songs");
});

test("validation rejects bad input", () => {
  const bad: [unknown, RegExp][] = [
    [null, /JSON object/],
    [{ mode: "dance" }, /Unknown mode/],
    [{ mode: "remix", sourceSongId: "mock-track-01", genreId: "polka" }, /Unknown genre/],
    [{ mode: "remix", genreId: "electronic" }, /source/],
    [{ mode: "remix", sourceSongId: "nope", genreId: "electronic" }, /Unknown song/],
    [{ mode: "remix", sourceSongId: "mock-track-01", sourceTrackId: TRACK_ID, genreId: "electronic" }, /not both/],
    [{ mode: "cover", sourceTrackId: "not-a-uuid", singerId: "dua-lipa" }, /Invalid/],
    [{ mode: "vibe", text: "acoustic" }, /source track/],
    [{ mode: "vibe", sourceTrackId: TRACK_ID, text: "   " }, /Describe/],
    [{ mode: "new", text: "x".repeat(281) }, /280/],
    [{ mode: "new", text: "ok", ideaId: "nope" }, /Unknown idea/],
  ];
  for (const [body, error] of bad) {
    const r = parseGenerateInput(body);
    assert.equal(r.ok, false, JSON.stringify(body));
    if (!r.ok) assert.match(r.error, error, JSON.stringify(body));
  }
});
