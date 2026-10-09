import Link from "next/link";
import { ModeIcon } from "@/components/icons/ModeIcon";
import type { Mode } from "@/lib/config/modes";

/** 72 px player tile, icon directly on the mode colour (CfPlayerSplit). */
export function ModeTile({ mode, href }: { mode: Mode; href: string }) {
  return (
    <Link
      href={href}
      className={`rounded-tile text-on-mode flex h-21 w-18 flex-none flex-col items-center justify-center gap-1.5 ${mode.bgClass}`}
    >
      <ModeIcon icon={mode.icon} size={30} strokeWidth={2} />
      <span className="text-[15px] font-bold">{mode.label}</span>
    </Link>
  );
}
