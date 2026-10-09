import Link from "next/link";
import { ModeIcon } from "@/components/icons/ModeIcon";
import type { Mode } from "@/lib/config/modes";

/** Create home colour block (01-02, CfHome). */
export function ModeCard({ mode, href }: { mode: Mode; href: string }) {
  return (
    <Link
      href={href}
      className={`rounded-card text-on-mode relative flex min-h-28 items-center overflow-hidden pr-30 pl-[22px] ${mode.bgClass}`}
    >
      <span className="flex min-w-0 flex-col justify-center gap-1">
        <span className="text-[26px] leading-[1.05] font-bold tracking-[-0.01em]">{mode.label}</span>
        <span className="text-[15px] font-medium text-[rgba(18,18,18,0.72)]">{mode.tagline}</span>
      </span>
      <ModeIcon
        icon={mode.icon}
        size={104}
        strokeWidth={1.4}
        className="absolute -right-1.5 -bottom-[18px] -rotate-14"
        style={{ color: "rgba(18,18,18,0.55)" }}
      />
    </Link>
  );
}
