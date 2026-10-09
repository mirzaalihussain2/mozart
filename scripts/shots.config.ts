// Screens captured by `pnpm shots` and compared with docs/designs/png/{id}_*.png.
// Each milestone adds the screens it builds.

export type Shot = {
  /** Screen ID from docs/designs/png, e.g. "01-01". */
  id: string;
  route: string;
  /** "dummy" signs in as Ali first. */
  auth: "none" | "dummy";
};

import { SCREEN_LIST } from "../lib/dev/screen-list";

// Every screen is captured from its gallery page (/dev/screens/{id}), which
// renders the real components in the exact state the design shows.
export const SHOTS: Shot[] = SCREEN_LIST.map((s) => ({ id: s.id, route: `/dev/screens/${s.id}`, auth: "none" }));
