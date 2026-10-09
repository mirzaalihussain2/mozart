"use client";

import { useEffect, useRef, useState } from "react";

/** Avatar on the Create home (CfHome) — opens a small menu with Log out. */
export function ProfileMenu({ initial }: { initial: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label="Profile"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        // 40 px circle per the design; ::after brings the tap target to 44 px.
        className="bg-raised text-text relative flex size-10 cursor-pointer items-center justify-center rounded-full p-0 text-[15px] font-semibold after:absolute after:-inset-0.5"
      >
        {initial}
      </button>
      {open ? (
        <div role="menu" className="bg-surface border-raised absolute top-12 right-0 z-30 min-w-36 rounded-xl border p-1 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              role="menuitem"
              className="text-text hover:bg-raised h-11 w-full cursor-pointer rounded-lg px-3 text-left text-[15px] font-semibold"
            >
              Log out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
