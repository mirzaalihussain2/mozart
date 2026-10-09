import Link from "next/link";
import { ModeIcon } from "@/components/icons/ModeIcon";
import type { Mode } from "@/lib/config/modes";

const TILE = "rounded-tile text-on-mode flex h-21 w-18 flex-none flex-col items-center justify-center gap-1.5";

/**
 * 72 px player tile, icon directly on the mode colour (CfPlayerSplit). A link
 * to step 2, or — once an anonymous visitor has used their make — a button
 * that opens the Send-to sheet.
 */
export function ModeTile({ mode, href, onClick }: { mode: Mode; href?: string; onClick?: () => void }) {
  const content = (
    <>
      <ModeIcon icon={mode.icon} size={30} strokeWidth={2} />
      <span className="text-[15px] font-bold">{mode.label}</span>
    </>
  );
  if (onClick || !href) {
    return (
      <button type="button" onClick={onClick} className={`${TILE} cursor-pointer ${mode.bgClass}`}>
        {content}
      </button>
    );
  }
  return (
    <Link href={href} className={`${TILE} ${mode.bgClass}`}>
      {content}
    </Link>
  );
}
