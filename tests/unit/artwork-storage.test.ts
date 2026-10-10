// pnpm test:unit — which stored images the app may delete (lib/server/artwork/storage.ts).
import assert from "node:assert/strict";
import { test } from "node:test";
import { publicUrl, trackArtworkPath } from "../../lib/server/artwork/storage";

process.env.SUPABASE_URL = "https://example-ref.supabase.co/";

test("public URLs come from the bucket path", () => {
  assert.equal(publicUrl("tracks/abc-1234.jpg"), "https://example-ref.supabase.co/storage/v1/object/public/artwork/tracks/abc-1234.jpg");
});

test("only generated tracks' images are ever deleted: never starters or other hosts", () => {
  assert.equal(trackArtworkPath(publicUrl("tracks/abc-1234.jpg")), "tracks/abc-1234.jpg");
  assert.equal(trackArtworkPath(publicUrl("starters/derek-latch-weeknd-1234.jpg")), null);
  assert.equal(trackArtworkPath("https://i.scdn.co/image/ab67616d0000b273"), null);
  assert.equal(trackArtworkPath("https://other-ref.supabase.co/storage/v1/object/public/artwork/tracks/abc.jpg"), null);
  assert.equal(trackArtworkPath(null), null);
});
