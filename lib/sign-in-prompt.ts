// What a signed-out visitor needs to be asked to sign in (client and server).

import type { ModeId, PlayerModeId } from "./config/modes";

export type SignInPrompt = {
  /** First name for "Send to {name}": the owner of the track they made theirs from. */
  sendTo: string;
  /** /auth/spotify/login?returnTo=… (their own track with ?share=1, or this track), for "send" and "save". */
  href: string;
  /** They've used their one anonymous make: further makes open the sheet. */
  makeUsed: boolean;
  /** What they made ("remix", "cover", …), for the sheet copy. */
  noun: string;
  /** The track they're on: "more" signs in back to its step 2 (/track/{slug}/{mode}). */
  slug: string;
};

/** Why the sign-in sheet opened, which picks its copy. */
export type SignInReason = "send" | "more" | "save";

/** The sheet to open. "more" (another make) also carries the mode they tapped. */
export type SignInAsk = { reason: "send" | "save" } | { reason: "more"; mode: PlayerModeId };

export const MODE_NOUN: Record<ModeId, string> = {
  remix: "remix",
  cover: "cover",
  rewrite: "rewrite",
  vibe: "version",
  new: "song",
};

/** The sign-in route, coming back to `returnTo` (validated there by lib/return-to.ts). */
export function signInHref(returnTo: string): string {
  return `/auth/spotify/login?returnTo=${encodeURIComponent(returnTo)}`;
}

/** The sheet's title: "Send to {name}" (CfSignup), or the make they're after. */
export function signInTitle(ask: SignInAsk, prompt: Pick<SignInPrompt, "sendTo">): string {
  return ask.reason === "more" ? `Sign in to make another ${MODE_NOUN[ask.mode]}` : `Send to ${prompt.sendTo}`;
}

/** The sentence under the title (CfSignup for "send"; the others are the same sheet, other doorways). */
export function signInCopy(reason: SignInReason, prompt: Pick<SignInPrompt, "sendTo" | "noun">): string {
  switch (reason) {
    case "send":
      return `Sign in with Spotify to save your ${prompt.noun} and send it back.`;
    case "more":
      return "You’ve made your free track. Sign in with Spotify to keep making more. They’ll be saved to your library.";
    case "save":
      return `Sign in with Spotify to make your own version and send it to ${prompt.sendTo}.`;
  }
}

/** Where "Continue with Spotify" goes: "more" comes back to the mode they tapped, on the track they were on. */
export function signInLink(ask: SignInAsk, prompt: Pick<SignInPrompt, "href" | "slug">): string {
  return ask.reason === "more" ? signInHref(`/track/${prompt.slug}/${ask.mode}`) : prompt.href;
}
