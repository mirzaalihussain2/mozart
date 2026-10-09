"use client";

import { useEffect, useRef } from "react";
import { useAudio } from "@/components/audio/AudioProvider";

/**
 * Avatar on the Create and Library tabs (TabHeader) — opens a small menu with Log out.
 * A native <details> so it works before hydration; JS only adds closing on an
 * outside tap and Escape. Spotify users see their profile photo (from
 * sign-in); everyone else, their initial.
 */
export function ProfileMenu({ initial, avatarUrl }: { initial: string; avatarUrl?: string | null }) {
  const root = useRef<HTMLDetailsElement>(null);
  const { stop } = useAudio();

  useEffect(() => {
    const close = (e: Event) => {
      const el = root.current;
      if (!el?.open) return;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !el.contains(e.target as Node)) el.open = false;
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  return (
    <details ref={root} className="relative">
      <summary
        role="button"
        aria-label="Profile"
        aria-haspopup="menu"
        // 40 px circle per the design; ::after brings the tap target to 44 px.
        className="bg-raised text-text relative flex size-10 cursor-pointer list-none items-center justify-center rounded-full text-[15px] font-semibold after:absolute after:-inset-0.5 [&::-webkit-details-marker]:hidden"
      >
        {avatarUrl ? (
          // Rounded on the img, not overflow-hidden on the summary, which would clip the ::after tap target.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="absolute inset-0 size-full rounded-full object-cover" />
        ) : (
          initial
        )}
      </summary>
      <div role="menu" className="bg-surface border-raised absolute top-12 right-0 z-30 min-w-36 rounded-xl border p-1 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
        {/* Logging out stops the music (the form still posts without JS). */}
        <form action="/auth/logout" method="post" onSubmit={() => stop()}>
          <button
            type="submit"
            role="menuitem"
            className="text-text hover:bg-raised h-11 w-full cursor-pointer rounded-lg px-3 text-left text-[15px] font-semibold"
          >
            Log out
          </button>
        </form>
      </div>
    </details>
  );
}
