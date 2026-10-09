"use client";

import { useEffect, useRef } from "react";
import { CloseIcon } from "@/components/icons";

type Props = {
  title: string;
  onClose: () => void;
  /** Accessible name of the dimmed backdrop (flow-index: "Close share sheet" / "Close"). */
  backdropLabel: string;
  /** Bottom padding in px (share 14, recipient share 34, sign-in 52). */
  paddingBottom: number;
  children: React.ReactNode;
};

/**
 * Bottom sheet over the current screen (CfShareOverSplit / CfSignup): the screen
 * stays visible under a translucent #121212 backdrop. Closes on the close button,
 * the backdrop and Escape; traps focus while open and restores it on close.
 */
export function BottomSheet({ title, onClose, backdropLabel, paddingBottom, children }: Props) {
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        sheet.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), textarea, input") ?? [],
      );
    // Focus the dialog itself (no ring on open); Tab then moves into it.
    sheet.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab") {
        const items = focusables();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (document.activeElement === sheet.current) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 mx-auto max-w-[390px]">
      <button
        type="button"
        aria-label={backdropLabel}
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[rgba(18,18,18,0.5)]"
      />
      <div
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="bg-surface rounded-t-sheet outline-none absolute inset-x-0 bottom-0 flex flex-col gap-4 px-5 pt-2.5"
        style={{ paddingBottom }}
      >
        <div className="bg-border-strong h-[5px] w-10 self-center rounded-[3px]" />
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-xl font-bold">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-text flex size-11 cursor-pointer items-center justify-center rounded-full"
          >
            <CloseIcon size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
