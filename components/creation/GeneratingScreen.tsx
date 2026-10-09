import Link from "next/link";
import { MODES, type ModeId } from "@/lib/config/modes";

// Bar heights from CfGenRemix.dc.html (identical on all eight Generating screens).
const BARS = [28, 56, 84, 44, 68, 92, 52, 76, 36, 60, 24];

type Props = {
  mode: ModeId;
  /** e.g. “Cruel Summer, but make it Bollywood.” (lib/generation.ts) */
  quote: string;
  /** When the track is ready, the whole screen is the "Track ready, open player" link. */
  readyHref?: string;
  /** Failure state (no design PNG): short message with Try again / Back. */
  error?: { message: string; onRetry: () => void; onBack: () => void };
  /** Pulse the bars (off in the gallery so captures match the static design). */
  animate?: boolean;
};

const SHELL = "text-on-mode fixed inset-0 select-none z-50 mx-auto flex max-w-[390px] flex-col items-center justify-center gap-7 px-8";

/** Generating screen in the mode colour (03-01…03-04, 06-01…06-04). */
export function GeneratingScreen({ mode, quote, readyHref, error, animate = true }: Props) {
  const bg = MODES[mode].bgClass;
  const content = (
    <>
      <div aria-hidden="true" className="flex h-24 items-center gap-1.5">
        {BARS.map((h, i) => (
          <span
            key={i}
            className={`bg-on-mode w-2 rounded-[4px] ${animate && !error ? "motion-safe:animate-[bar_1.1s_ease-in-out_infinite]" : ""} ${error ? "opacity-30" : ""}`}
            style={{ height: h, animationDelay: `${(i % 5) * -0.22}s` }}
          />
        ))}
      </div>
      <div className="text-center text-2xl font-bold" role={error ? "alert" : undefined}>
        {error ? error.message : "Making your track…"}
      </div>
      <div
        role={error ? undefined : "status"}
        className="w-full rounded-2xl bg-[rgba(18,18,18,0.12)] px-[18px] py-4 text-center text-[15px] leading-[1.45] font-semibold"
      >
        {quote}
      </div>
      {error ? (
        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={error.onRetry}
            className="bg-on-mode flex h-14 w-full cursor-pointer items-center justify-center rounded-full text-[17px] leading-tight font-semibold text-accent"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={error.onBack}
            className="border-on-mode flex h-14 w-full cursor-pointer items-center justify-center rounded-full border-[1.5px] text-[17px] leading-tight font-semibold"
          >
            Back
          </button>
        </div>
      ) : null}
    </>
  );

  if (readyHref && !error) {
    return (
      <Link href={readyHref} aria-label="Track ready, open player" className={`${SHELL} ${bg}`}>
        {content}
      </Link>
    );
  }
  return (
    <div className={`${SHELL} ${bg}`} aria-busy={!error}>
      {content}
    </div>
  );
}
