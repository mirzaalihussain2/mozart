// pnpm test:unit — the sign-in sheet's title, copy and link (lib/sign-in-prompt.ts).
import assert from "node:assert/strict";
import { test } from "node:test";
import { safeReturnTo } from "../../lib/return-to";
import { trackSlugFromPath } from "../../lib/sign-in";
import { signInCopy, signInLink, signInTitle, type SignInPrompt } from "../../lib/sign-in-prompt";

const PROMPT: SignInPrompt = {
  sendTo: "Ali",
  href: "/auth/spotify/login?returnTo=%2Ftrack%2Ftheirs123%3Fshare%3D1",
  makeUsed: true,
  noun: "remix",
  slug: "cruel-bolly",
};

const returnToOf = (href: string) => new URL(href, "http://same.site").searchParams.get("returnTo");

test("send and save keep 'Send to {name}' and their copy", () => {
  assert.equal(signInTitle({ reason: "send" }, PROMPT), "Send to Ali");
  assert.equal(signInTitle({ reason: "save" }, PROMPT), "Send to Ali");
  assert.equal(signInCopy("send", PROMPT), "Sign in with Spotify to save your remix and send it back.");
  assert.equal(signInCopy("save", PROMPT), "Sign in with Spotify to make your own version and send it to Ali.");
});

test("more: the title names the mode they tapped; the copy never names the owner", () => {
  assert.equal(signInTitle({ reason: "more", mode: "remix" }, PROMPT), "Sign in to make another remix");
  assert.equal(signInTitle({ reason: "more", mode: "cover" }, PROMPT), "Sign in to make another cover");
  assert.equal(signInTitle({ reason: "more", mode: "rewrite" }, PROMPT), "Sign in to make another rewrite");
  assert.equal(signInTitle({ reason: "more", mode: "vibe" }, PROMPT), "Sign in to make another version");
  const copy = signInCopy("more", PROMPT);
  assert.equal(copy, "You’ve made your free track. Sign in with Spotify to keep making more. They’ll be saved to your library.");
  assert.doesNotMatch(copy, /Ali/);
});

test("send and save sign in to the page's link; more comes back to that mode on this track", () => {
  assert.equal(signInLink({ reason: "send" }, PROMPT), PROMPT.href);
  assert.equal(signInLink({ reason: "save" }, PROMPT), PROMPT.href);
  const more = signInLink({ reason: "more", mode: "cover" }, PROMPT);
  assert.match(more, /^\/auth\/spotify\/login\?returnTo=/);
  const returnTo = returnToOf(more)!;
  assert.equal(returnTo, "/track/cruel-bolly/cover");
  // It survives returnTo validation, and the dummy fallback still finds the track.
  assert.equal(safeReturnTo(returnTo), returnTo);
  assert.equal(trackSlugFromPath(returnTo), "cruel-bolly");
  assert.equal(returnToOf(signInLink({ reason: "more", mode: "vibe" }, PROMPT)), "/track/cruel-bolly/vibe");
});
