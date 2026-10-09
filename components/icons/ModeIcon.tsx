import type { IconPath } from "@/lib/config/modes";

type Props = {
  icon: IconPath[];
  size: number;
  strokeWidth: number;
  className?: string;
  style?: React.CSSProperties;
};

/** Renders a mode icon from lib/config/modes.ts (24 × 24 stroke paths). */
export function ModeIcon({ icon, size, strokeWidth, className, style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {icon.map((p) => (
        <path key={p.d} d={p.d} fill={p.fill} strokeWidth={p.strokeWidth} />
      ))}
    </svg>
  );
}
