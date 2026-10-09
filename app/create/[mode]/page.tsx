import { notFound } from "next/navigation";
import { StepOne } from "@/components/creation/StepOne";
import { MODES } from "@/lib/config/modes";
import { requireUser } from "@/lib/server/session";

// 02-01 / 02-03 / 02-05 · Step 1 · Pick a song.
export const instant = false;

const STEP_MODES = ["remix", "cover", "rewrite"] as const;
type StepMode = (typeof STEP_MODES)[number];
const isStepMode = (m: string): m is StepMode => (STEP_MODES as readonly string[]).includes(m);

export default async function StepOnePage({ params }: PageProps<"/create/[mode]">) {
  const { mode } = await params;
  if (!isStepMode(mode)) notFound();
  await requireUser();
  return <StepOne mode={MODES[mode]} />;
}
