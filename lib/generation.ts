import type { ModeId } from "./config/modes";

// Copy for the Generating screens (CfGen*.dc.html), shared by client and server.

export type QuoteInput = {
  mode: ModeId;
  /** Root song title, e.g. "Cruel Summer". Absent for Something new. */
  song?: string;
  /** Set when making from someone else's track: "Ali" → "Ali’s Cruel Summer". */
  owner?: string;
  /** Genre, singer, theme phrase or free text. */
  change: string;
};

const trimEnd = (s: string) => s.trim().replace(/[.!?…]+$/, "");
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** “Cruel Summer, but make it Bollywood.” and friends. */
export function generationQuote({ mode, song, owner, change }: QuoteInput): string {
  const subject = `${owner ? `${owner}’s ` : ""}${song ?? ""}`;
  const text = trimEnd(change);
  switch (mode) {
    case "remix":
      return `“${subject}, but make it ${text}.”`;
    case "cover":
      return `“${subject}, sung by ${text}.”`;
    case "rewrite":
      return `“${subject}, but it’s about ${text}.”`;
    case "vibe":
      return `“${subject}, but ${lowerFirst(text)}.”`;
    case "new":
      return `“${text}.”`;
  }
}
