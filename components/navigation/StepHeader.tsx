import type { Mode } from "@/lib/config/modes";
import { PillBackButton } from "./PillBackButton";

/** Pill back button + optional "Step n of 2" (only in Create-home flows). */
export function StepHeader({
  mode,
  backHref,
  step,
  onBack,
}: {
  mode: Mode;
  backHref: string;
  step?: 1 | 2;
  onBack?: () => void;
}) {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between">
      <PillBackButton mode={mode} href={backHref} onClick={onBack} />
      {step ? <span className="text-text-secondary text-[13px]">Step {step} of 2</span> : null}
    </div>
  );
}
