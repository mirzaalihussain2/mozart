import type { ReactNode } from "react";
import { CreateHome } from "@/components/creation/CreateHome";
import { GeneratingScreen } from "@/components/creation/GeneratingScreen";
import { SomethingNew } from "@/components/creation/SomethingNew";
import { StepOne } from "@/components/creation/StepOne";
import { StepTwo } from "@/components/creation/StepTwo";
import { LandingView } from "@/components/landing/LandingView";
import { LibraryView } from "@/components/library/LibraryView";
import { MODES, type ModeId } from "@/lib/config/modes";
import {
  createStepTwo,
  LIBRARY_ROWS,
  NEW_TYPED,
  NOW_PLAYING,
  playerStepTwo,
  VIBE_TYPED,
} from "@/lib/dev/fixtures";

// Each screen in exactly the state its design shows, built from the real
// components with fixed props (lib/dev/fixtures.ts).
export const SCREENS: Record<string, () => ReactNode> = {
  "01-01": () => <LandingView />,
  "01-02": () => <CreateHome initial="A" />,
  "01-03": () => <CreateHome initial="A" nowPlaying={NOW_PLAYING} />,
  "02-01": () => <StepOne mode={MODES.remix} />,
  "02-02": () => <StepTwo {...createStepTwo("remix", "Cruel Summer", "Bollywood")} />,
  "02-03": () => <StepOne mode={MODES.cover} />,
  "02-04": () => <StepTwo {...createStepTwo("cover", "In Too Deep", "Arijit Singh")} />,
  "02-05": () => <StepOne mode={MODES.rewrite} />,
  "02-06": () => <StepTwo {...createStepTwo("rewrite", "Payphone", "Moving to London")} />,
  "02-07": () => <SomethingNew destination="/track/cruel-bolly" rotate={false} />,
  "02-08": () => <SomethingNew destination="/track/cruel-bolly" rotate={false} initialText={NEW_TYPED} initialFocused />,
  "03-01": () => <Gen mode="remix" quote="“Cruel Summer, but make it Bollywood.”" />,
  "03-02": () => <Gen mode="cover" quote="“In Too Deep, sung by Arijit Singh.”" />,
  "03-03": () => <Gen mode="rewrite" quote="“Payphone, but it’s about moving to London.”" />,
  "03-04": () => <Gen mode="new" quote="“A sad garage song about the night bus home.”" />,
  "06-01": () => <Gen mode="remix" quote="“Ali’s Cruel Summer, but make it Electronic.”" />,
  "06-02": () => <Gen mode="cover" quote="“Ali’s Cruel Summer, sung by Arijit Singh.”" />,
  "06-03": () => <Gen mode="rewrite" quote="“Ali’s Cruel Summer, but it’s about moving to London.”" />,
  "06-04": () => <Gen mode="vibe" quote="“Ali’s Cruel Summer, but a stripped-back acoustic version.”" />,
  "04-01": () => <StepTwo {...playerStepTwo("remix", false, { initialChoice: "Electronic" })} />,
  "04-02": () => <StepTwo {...playerStepTwo("cover", false, { initialChoice: "Arijit Singh" })} />,
  "04-03": () => <StepTwo {...playerStepTwo("rewrite", false, { initialChoice: "Moving to London" })} />,
  "04-04": () => <StepTwo {...playerStepTwo("vibe", false)} />,
  "04-05": () => <StepTwo {...playerStepTwo("vibe", false, { initialText: VIBE_TYPED, initialFocused: true })} />,
  "05-02": () => <StepTwo {...playerStepTwo("remix", true, { initialChoice: "Electronic" })} />,
  "05-03": () => <StepTwo {...playerStepTwo("cover", true, { initialChoice: "Arijit Singh" })} />,
  "05-04": () => <StepTwo {...playerStepTwo("rewrite", true, { initialChoice: "Moving to London" })} />,
  "05-05": () => <StepTwo {...playerStepTwo("vibe", true)} />,
  "05-06": () => <StepTwo {...playerStepTwo("vibe", true, { initialText: VIBE_TYPED, initialFocused: true })} />,
  "07-01": () => <LibraryView rows={LIBRARY_ROWS} />,
  "07-02": () => <LibraryView rows={LIBRARY_ROWS} nowPlaying={NOW_PLAYING} />,
};

function Gen({ mode, quote }: { mode: ModeId; quote: string }) {
  return <GeneratingScreen mode={mode} quote={quote} destination="/track/cruel-bolly" animate={false} />;
}

export const BUILT = new Set(Object.keys(SCREENS));
