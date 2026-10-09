import type { ReactNode } from "react";
import { CreateHome } from "@/components/creation/CreateHome";
import { LandingView } from "@/components/landing/LandingView";
import { LibraryView } from "@/components/library/LibraryView";
import { LIBRARY_ROWS, NOW_PLAYING } from "@/lib/dev/fixtures";

// Each screen in exactly the state its design shows, built from the real
// components with fixed props (lib/dev/fixtures.ts).
export const SCREENS: Record<string, () => ReactNode> = {
  "01-01": () => <LandingView />,
  "01-02": () => <CreateHome initial="A" />,
  "01-03": () => <CreateHome initial="A" nowPlaying={NOW_PLAYING} />,
  "07-01": () => <LibraryView rows={LIBRARY_ROWS} />,
  "07-02": () => <LibraryView rows={LIBRARY_ROWS} nowPlaying={NOW_PLAYING} />,
};

export const BUILT = new Set(Object.keys(SCREENS));
