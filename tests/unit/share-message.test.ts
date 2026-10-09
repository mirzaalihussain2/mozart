// pnpm test:unit — the share text and WhatsApp link (lib/share-message.ts).
import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanUrl, shareMessage, whatsappHref } from "../../lib/share-message";

const TRACK_URL = "https://mozart.example.com/track/abc123defg";

test("the agreed message", () => {
  assert.equal(
    shareMessage("Cruel Summer × Bollywood", TRACK_URL),
    "“Cruel Summer × Bollywood” — I made this on Mozart. Listen and make your own version: https://mozart.example.com/track/abc123defg",
  );
});

test("WhatsApp link round-trips quotes, ×, &, # and emoji", () => {
  const title = `Rock & "Roll" × #1 😀`;
  const href = whatsappHref(title, TRACK_URL);
  assert.ok(href.startsWith("https://wa.me/?text="));
  const text = new URL(href).searchParams.get("text");
  assert.equal(text, shareMessage(title, TRACK_URL));
  assert.ok(!/[ &#"]/.test(href.slice("https://wa.me/?text=".length)), "raw characters left unencoded");
});

test("shared URLs are always the clean track TRACK_URL", () => {
  assert.equal(cleanUrl(`${TRACK_URL}?view=recipient&share=1#x`), TRACK_URL);
  assert.equal(cleanUrl(TRACK_URL), TRACK_URL);
});
