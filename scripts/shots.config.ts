// Screens captured by `pnpm shots` and compared with docs/designs/png/{id}_*.png.
// Each milestone adds the screens it builds.

export type Shot = {
  /** Screen ID from docs/designs/png, e.g. "01-01". */
  id: string;
  route: string;
  /** "dummy" signs in as Ali first. */
  auth: "none" | "dummy";
};

export const SHOTS: Shot[] = [{ id: "01-01", route: "/", auth: "none" }];
