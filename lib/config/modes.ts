// One source of truth for the five creation modes (AGENTS.md §3–4).
// Icon paths are copied verbatim from docs/designs/html/CfHome.dc.html and
// CfPlayerSplit.dc.html — don't redraw them. All icons use viewBox 0 0 24 24,
// stroke="currentColor", round caps and joins.

export const MODE_IDS = ["remix", "cover", "rewrite", "vibe", "new"] as const;
export type ModeId = (typeof MODE_IDS)[number];

export type IconPath = {
  d: string;
  /** Omit for stroke-only paths. */
  fill?: string;
  strokeWidth?: number;
};

export type Mode = {
  id: ModeId;
  label: string;
  tagline: string;
  /** Token name in app/globals.css (`--color-{token}`). */
  token: ModeId;
  /** CSS value for inline styles, e.g. SVG strokes. */
  color: string;
  /** Raw hex, for places CSS variables can't reach (Open Graph images). Same as the token. */
  hex: string;
  /** Static Tailwind classes so they survive class detection. */
  bgClass: string;
  textClass: string;
  icon: IconPath[];
};

const VINYL =
  "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM6.5 12A5.5 5.5 0 0 1 12 6.5M17.5 12a5.5 5.5 0 0 1-5.5 5.5";
const MIC =
  "M12 2a3.5 3.5 0 0 0-3.5 3.5v5a3.5 3.5 0 0 0 7 0v-5A3.5 3.5 0 0 0 12 2zM8.5 7.5h7M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V22M9 22h6";
const LYRICS_BUBBLE =
  "M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM7 8.5h10M7 12h6";

/** Stroke-only wand from the Create home "Something new" card. */
const WAND_STROKE: IconPath[] = [
  {
    d: "M2.6 19.6L12.6 9.6L14.4 11.4L4.4 21.4ZM10.6 11.6L12.4 13.4M18 2.5Q18.5 5.5 21.5 6Q18.5 6.5 18 9.5Q17.5 6.5 14.5 6Q17.5 5.5 18 2.5ZM8 2Q8.3 3.7 10 4Q8.3 4.3 8 6Q7.7 4.3 6 4Q7.7 3.7 8 2ZM20.5 12.5Q20.7 13.8 22 14Q20.7 14.2 20.5 15.5Q20.3 14.2 19 14Q20.3 13.8 20.5 12.5Z",
  },
];

/** Filled wand from the player's Vibe tile. */
const WAND_FILLED: IconPath[] = [
  { d: "M2.1 20.4L11.4 11.1L12.9 12.6L3.6 21.9Z", fill: "currentColor", strokeWidth: 1 },
  { d: "M11.4 11.1L14.1 8.4L15.6 9.9L12.9 12.6Z", fill: "#ffffff", strokeWidth: 1 },
  {
    d: "M18.5 2.5Q19 5.5 22 6Q19 6.5 18.5 9.5Q18 6.5 15 6Q18 5.5 18.5 2.5ZM8 2Q8.3 3.7 10 4Q8.3 4.3 8 6Q7.7 4.3 6 4Q7.7 3.7 8 2ZM20.5 12.5Q20.7 13.8 22 14Q20.7 14.2 20.5 15.5Q20.3 14.2 19 14Q20.3 13.8 20.5 12.5Z",
  },
];

export const MODES: Record<ModeId, Mode> = {
  remix: {
    id: "remix",
    label: "Remix",
    tagline: "Same song, new genre.",
    token: "remix",
    color: "var(--color-remix)",
    hex: "#ff754c",
    bgClass: "bg-remix",
    textClass: "text-remix",
    icon: [{ d: VINYL }],
  },
  cover: {
    id: "cover",
    label: "Cover",
    tagline: "Same song, new artist.",
    token: "cover",
    color: "var(--color-cover)",
    hex: "#a259ff",
    bgClass: "bg-cover",
    textClass: "text-cover",
    icon: [{ d: MIC }],
  },
  rewrite: {
    id: "rewrite",
    label: "Rewrite",
    tagline: "Same song, new lyrics.",
    token: "rewrite",
    color: "var(--color-rewrite)",
    hex: "#2ec4b6",
    bgClass: "bg-rewrite",
    textClass: "text-rewrite",
    icon: [{ d: LYRICS_BUBBLE }],
  },
  vibe: {
    id: "vibe",
    label: "Vibe",
    // No tagline in the designs; derived from the "…but your way." prompt.
    tagline: "Same song, your way.",
    token: "vibe",
    color: "var(--color-vibe)",
    hex: "#ffc93c",
    bgClass: "bg-vibe",
    textClass: "text-vibe",
    icon: WAND_FILLED,
  },
  new: {
    id: "new",
    label: "Something new",
    tagline: "Prompt a brand-new song.",
    token: "new",
    color: "var(--color-new)",
    hex: "#ffc93c",
    bgClass: "bg-new",
    textClass: "text-new",
    icon: WAND_STROKE,
  },
};

/** Order of the cards on the Create home (01-02). */
export const HOME_MODES: ModeId[] = ["remix", "cover", "rewrite", "new"];
/** Order of the tiles on a player (03-05). */
export const PLAYER_MODES: ModeId[] = ["remix", "cover", "rewrite", "vibe"];

export function isModeId(value: unknown): value is ModeId {
  return typeof value === "string" && (MODE_IDS as readonly string[]).includes(value);
}
