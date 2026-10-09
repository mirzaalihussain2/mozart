"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckIcon } from "@/components/icons";

/** How long a toast stays up. */
export const TOAST_MS = 4000;

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

/**
 * `?saved=1` on a screen other than the player (a step 2 after "Sign in to
 * make another …"): the toast once, then the URL without the parameter. Keep
 * it mounted — `show` is captured on first render, so the clean-up doesn't hide it.
 */
export function SavedToast({ show, cleanHref }: { show: boolean; cleanHref?: string }) {
  const router = useRouter();
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (cleanHref) router.replace(cleanHref, { scroll: false });
  }, [cleanHref, router]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), TOAST_MS);
    return () => clearTimeout(t);
  }, [visible]);

  return visible ? <Toast>Signed in · saved to your library</Toast> : null;
}
