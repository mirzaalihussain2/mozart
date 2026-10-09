import { CheckIcon } from "@/components/icons";

/** Off-white status pill at the top of the screen (CfShareSignedIn). */
export function Toast({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="bg-accent text-on-accent fixed top-14 left-1/2 z-50 flex h-9 -translate-x-1/2 items-center gap-2 rounded-full pr-3.5 pl-2 text-sm font-bold whitespace-nowrap shadow-[0_6px_20px_rgba(0,0,0,0.45)]"
    >
      <span className="bg-bg text-accent flex size-[22px] items-center justify-center rounded-full">
        <CheckIcon size={12} strokeWidth={3.2} />
      </span>
      {children}
    </div>
  );
}
