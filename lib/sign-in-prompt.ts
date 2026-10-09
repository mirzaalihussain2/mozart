// What a signed-out visitor needs to be asked to sign in (client and server).

import type { ModeId } from "./config/modes";

export type SignInPrompt = {
  /** First name for "Send to {name}": the owner of the track they made theirs from. */
  sendTo: string;
  /** /auth/spotify/login?returnTo=… (their own track with ?share=1, or this track). */
  href: string;
  /** They've used their one anonymous make: further makes open the sheet. */
  makeUsed: boolean;
  /** What they made ("remix", "cover", …), for the sheet copy. */
  noun: string;
};

/** Why the Send-to sheet opened, which picks its copy. */
export type SignInReason = "send" | "more" | "save";

export const MODE_NOUN: Record<ModeId, string> = {
  remix: "remix",
  cover: "cover",
  rewrite: "rewrite",
  vibe: "version",
  new: "song",
};

/** The sentence under "Send to {name}" (CfSignup for "send"; the others are the same sheet, other doorways). */
export function signInCopy(reason: SignInReason, prompt: Pick<SignInPrompt, "sendTo" | "noun">): string {
  switch (reason) {
    case "send":
      return `Sign in with Spotify to save your ${prompt.noun} and send it back.`;
    case "more":
      return `You’ve made your free version. Sign in with Spotify to make more and send yours back to ${prompt.sendTo}.`;
    case "save":
      return `Sign in with Spotify to make your own version and send it to ${prompt.sendTo}.`;
  }
}
