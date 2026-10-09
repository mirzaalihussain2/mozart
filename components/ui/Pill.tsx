"use client";

import type { Mode } from "@/lib/config/modes";

type Size = "icon" | "avatar" | "text";

// CfRemix2 (icon), CfCover2 (avatar), CfRewrite2 (text).
const SIZES: Record<Size, string> = {
  icon: "h-12 gap-2 pr-[18px] pl-3.5 text-base",
  avatar: "h-12 gap-2.5 pr-[18px] pl-1.5 text-base",
  text: "h-11 px-4 text-[15px]",
};

type Props = {
  mode: Mode;
  size: Size;
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
};

/** Selectable option pill (role="radio"); selected state uses the mode colour. */
export function Pill({ mode, size, selected, onSelect, children }: Props) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex cursor-pointer items-center rounded-full border ${SIZES[size]} ${
        selected ? `${mode.bgClass} text-on-mode font-bold` : "border-border text-text bg-transparent font-medium"
      }`}
      style={selected ? { borderColor: mode.color } : undefined}
    >
      {children}
    </button>
  );
}
