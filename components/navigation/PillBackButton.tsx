import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";
import type { Mode } from "@/lib/config/modes";

/** Tinted pill back button: ‹ + mode name in the mode colour (CfRemix1). */
export function PillBackButton({ mode, href, onClick }: { mode: Mode; href: string; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label="Back"
      // 36 px tall to match the design; the ::after extends the tap target to 44 px.
      className={`relative flex h-9 items-center gap-1 rounded-full border pr-3.5 pl-2 text-sm font-bold whitespace-nowrap after:absolute after:-inset-y-1 after:inset-x-0 ${mode.textClass}`}
      style={{
        background: `color-mix(in srgb, ${mode.color} 16%, transparent)`,
        borderColor: `color-mix(in srgb, ${mode.color} 40%, transparent)`,
      }}
    >
      <ChevronLeftIcon size={18} strokeWidth={2.4} />
      {mode.label}
    </Link>
  );
}
