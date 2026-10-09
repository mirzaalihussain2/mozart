import type { ReactNode } from "react";
import { LandingView } from "@/components/landing/LandingView";

// Each screen in exactly the state its design shows, built from the real
// components with fixed props (lib/dev/fixtures.ts).
export const SCREENS: Record<string, () => ReactNode> = {
  "01-01": () => <LandingView />,
};

export const BUILT = new Set(Object.keys(SCREENS));
