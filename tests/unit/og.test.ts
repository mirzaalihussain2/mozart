// pnpm test:unit — Open Graph title wrapping (lib/og.ts).
import assert from "node:assert/strict";
import { test } from "node:test";
import { ogTitleLines } from "../../lib/og";

test("short titles stay on one line", () => {
  assert.deepEqual(ogTitleLines("Cinematic pop"), ["Cinematic pop"]);
});

test("titles wrap at spaces onto two lines", () => {
  assert.deepEqual(ogTitleLines("Cruel Summer × Bollywood"), ["Cruel Summer ×", "Bollywood"]);
  assert.deepEqual(ogTitleLines("Euphoric electronic pop"), ["Euphoric", "electronic pop"]);
});

test("long titles stop at two lines with an ellipsis", () => {
  const lines = ogTitleLines("Cruel Summer × Make it a stripped-back acoustic version");
  assert.equal(lines.length, 2);
  assert.ok(lines[1].endsWith("…"), lines[1]);
  for (const l of lines) assert.ok(l.length <= 17, l);
});

test("a single very long word is split, then truncated", () => {
  const lines = ogTitleLines("Supercalifragilisticexpialidociousness forever");
  assert.equal(lines.length, 2);
  assert.ok(lines[1].endsWith("…"));
});
