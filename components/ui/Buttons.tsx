import Link from "next/link";
import type { Mode } from "@/lib/config/modes";

const BASE = "flex h-14 w-full items-center justify-center gap-2.5 rounded-full text-[17px] font-semibold";

type Common = { children: React.ReactNode; className?: string };
type AsLink = Common & { href: string; onClick?: never; disabled?: never; type?: never };
type AsButton = Common & { href?: never; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" };

function Base({ cls, ...props }: (AsLink | AsButton) & { cls: string }) {
  const className = `${BASE} ${cls} ${props.className ?? ""}`;
  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={className}>
        {props.children}
      </Link>
    );
  }
  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      className={`${className} cursor-pointer disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {props.children}
    </button>
  );
}

/** Off-white accent button with #121212 text. */
export function PrimaryButton(props: AsLink | AsButton) {
  return <Base {...props} cls="bg-accent text-on-accent" />;
}

/** Generate buttons: the mode colour with #121212 text. */
export function ModeButton({ mode, ...props }: (AsLink | AsButton) & { mode: Mode }) {
  return <Base {...props} cls={`${mode.bgClass} text-on-mode`} />;
}
