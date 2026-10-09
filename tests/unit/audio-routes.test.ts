// pnpm test:unit — where audio keeps playing (lib/audio-routes.ts).
import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldKeepPlaying, showsMiniPlayer } from "../../lib/audio-routes";

test("keeps playing on the player, the Create home and the Library", () => {
  for (const p of ["/track/abc", "/track/cruel-bolly", "/create", "/library"]) assert.equal(shouldKeepPlaying(p), true, p);
});

test("pauses everywhere else", () => {
  for (const p of ["/track/abc/remix", "/track/abc/vibe", "/create/remix", "/create/remix/mock-track-01", "/create/new", "/", "/dev/screens"]) {
    assert.equal(shouldKeepPlaying(p), false, p);
  }
});

test("the mini player only on /create and /library", () => {
  assert.equal(showsMiniPlayer("/create"), true);
  assert.equal(showsMiniPlayer("/library"), true);
  assert.equal(showsMiniPlayer("/track/abc"), false);
  assert.equal(showsMiniPlayer("/create/remix"), false);
});
