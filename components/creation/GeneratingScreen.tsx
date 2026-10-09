import Link from "next/link";
import { MODES, type ModeId } from "@/lib/config/modes";

// Bar heights from CfGenRemix.dc.html (identical on all eight Generating screens).
const BARS = [28, 56, 84, 44, 68, 92, 52, 76, 36, 60, 24];

type Props = {
  mode: ModeId;
  /** e.g. “Cruel Summer, but make it Bollywood.” (lib/generation.ts) */
  quote: string;
  /** The player to open; the whole screen is the "Track ready, open player" link. */
  destination: string;
  /** Pulse the bars (off in the gallery so captures match the static design). */
  animate?: boolean;
};

/** Generating screen in the mode colour (03-01…03-04, 06-01…06-04). */
export function GeneratingScreen({ mode, quote, destination, animate = true }: Props) {
  const m = MODES[mode];
  return (
    <Link
      href={destination}
      aria-label="Track ready, open player"
      className={`text-on-mode fixed inset-0 z-50 mx-auto flex max-w-[390px] flex-col items-center justify-center gap-7 px-8 ${m.bgClass}`}
    >
      <div aria-hidden="true" className="flex h-24 items-center gap-1.5">
        {BARS.map((h, i) => (
          <span
            key={i}
            className={`bg-on-mode w-2 rounded-[4px] ${animate ? "motion-safe:animate-[bar_1.1s_ease-in-out_infinite]" : ""}`}
            style={{ height: h, animationDelay: `${(i % 5) * -0.22}s` }}
          />
        ))}
      </div>
      <div className="text-center text-2xl font-bold">Making your track…</div>
      <div
        role="status"
        className="w-full rounded-2xl bg-[rgba(18,18,18,0.12)] px-[18px] py-4 text-center text-[15px] leading-[1.45] font-semibold"
      >
        {quote}
      </div>
    </Link>
  );
}
