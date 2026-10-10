// pnpm test:unit — album art prompts (lib/config/artwork-prompts.ts).
import assert from "node:assert/strict";
import { test } from "node:test";
import { artworkPrompt, GENRE_LOOKS } from "../../lib/config/artwork-prompts";
import { GENRES } from "../../lib/config/genres";

const SONG = { song: "Cruel Summer", artist: "Taylor Swift" };

test("every genre has a look", () => {
  for (const g of GENRES) assert.ok(GENRE_LOOKS[g.id], g.id);
});

test("each mode asks for something different from the same song", () => {
  const prompts = [
    artworkPrompt({ mode: "remix", ...SONG, genreId: "bollywood", cover: true }),
    artworkPrompt({ mode: "cover", ...SONG, singer: "Arijit Singh", cover: true, singerPhoto: true }),
    artworkPrompt({ mode: "rewrite", ...SONG, themeId: "heartbreak", cover: true }),
    artworkPrompt({ mode: "vibe", ...SONG, text: "about rain on a cold day", cover: true }),
  ].map((p) => p.prompt);
  assert.equal(new Set(prompts).size, prompts.length);
  for (const p of prompts) assert.match(p, /"Cruel Summer" by Taylor Swift/);
  assert.match(prompts[0], /Bollywood: .*marigold/);
  assert.match(prompts[1], /Arijit Singh's cover version/);
  assert.match(prompts[2], /about heartbreak/);
  assert.match(prompts[3], /rain on a cold day/);
});

test("two remixes of the same song differ by the genre's look", () => {
  const bollywood = artworkPrompt({ mode: "remix", ...SONG, genreId: "bollywood", cover: true }).prompt;
  const drill = artworkPrompt({ mode: "remix", ...SONG, genreId: "drill", cover: true }).prompt;
  assert.notEqual(bollywood, drill);
  assert.ok(drill.includes(GENRE_LOOKS.drill));
});

test("images: the cover first, then the singer's photo; none without them", () => {
  assert.deepEqual(artworkPrompt({ mode: "cover", ...SONG, singer: "Adele", cover: true, singerPhoto: true }).images, ["cover", "singer"]);
  assert.deepEqual(artworkPrompt({ mode: "cover", ...SONG, singer: "Adele", cover: false, singerPhoto: true }).images, ["singer"]);
  assert.deepEqual(artworkPrompt({ mode: "cover", ...SONG, singer: "Adele", cover: true, singerPhoto: false }).images, ["cover"]);
  assert.deepEqual(artworkPrompt({ mode: "cover", ...SONG, singer: "Adele", cover: false, singerPhoto: false }).images, []);
  assert.deepEqual(artworkPrompt({ mode: "remix", ...SONG, genreId: "jazz", cover: false }).images, []);
  assert.deepEqual(artworkPrompt({ mode: "new", text: "A rainy-day lo-fi song" }).images, []);
});

test("every prompt asks for a square image with no text; text-only ones never say \"album cover\" or quote", () => {
  const withImage = [
    artworkPrompt({ mode: "remix", ...SONG, genreId: "jazz", cover: true }),
    artworkPrompt({ mode: "rewrite", ...SONG, themeId: "payday", cover: true }),
    artworkPrompt({ mode: "vibe", ...SONG, text: "slower", cover: true }),
  ];
  for (const p of withImage) assert.match(p.prompt, /Square album cover art\. No text/);
  const textOnly = [
    artworkPrompt({ mode: "remix", ...SONG, genreId: "jazz", cover: false }),
    artworkPrompt({ mode: "cover", ...SONG, singer: "Adele", cover: false, singerPhoto: false }),
    artworkPrompt({ mode: "rewrite", ...SONG, themeId: "payday", cover: false }),
    artworkPrompt({ mode: "vibe", ...SONG, text: "slower", cover: false }),
    artworkPrompt({ mode: "new", text: "A rainy-day lo-fi song" }),
  ];
  for (const p of textOnly) {
    assert.match(p.prompt, /^A striking square .*no lettering anywhere\.$/);
    assert.doesNotMatch(p.prompt, /album cover|"/i);
  }
});

test("free text is never quoted (FLUX draws quoted words)", () => {
  assert.doesNotMatch(artworkPrompt({ mode: "new", text: "A late-night garage track" }).prompt, /"A late-night/);
  assert.doesNotMatch(artworkPrompt({ mode: "vibe", ...SONG, text: "slower and sadder", cover: true }).prompt, /"slower/);
});

test("no artist: just the song's title", () => {
  assert.match(artworkPrompt({ mode: "rewrite", song: "Cruel Summer", artist: "", themeId: "payday", cover: true }).prompt, /cover of "Cruel Summer"\. /);
  assert.match(artworkPrompt({ mode: "rewrite", song: "Cruel Summer", artist: "", themeId: "payday", cover: false }).prompt, /version of Cruel Summer rewritten/);
});
