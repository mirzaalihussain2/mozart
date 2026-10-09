"use client";

import { useEffect, useState } from "react";
import type { MeResponse } from "@/app/api/me/route";
import { PrimaryButton } from "./Buttons";

type Props = {
  title: string;
  message: string;
  /** Error pages only: re-render the segment that failed. */
  onRetry?: () => void;
};

/**
 * 404 and error page (app/not-found.tsx, app/error.tsx); no design, so it
 * borrows the landing page's layout. "Back to Mozart" goes to /create when
 * signed in, else / (which itself redirects signed-in visitors to /create).
 */
export function ErrorScreen({ title, message, onRetry }: Props) {
  const [home, setHome] = useState("/");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json() as Promise<MeResponse>)
      .then((me) => {
        if (me.user) setHome("/create");
      })
      .catch(() => {});
  }, []);

  return (
    <main className="flex h-dvh min-h-[560px] flex-col px-6 pt-[60px] pb-[max(40px,env(safe-area-inset-bottom))]">
      <div className="text-2xl leading-[30px] font-bold tracking-[-0.01em]">Mozart</div>
      <div className="flex flex-grow flex-col items-center justify-center gap-3 text-center">
        <h1 className="m-0 text-[32px] leading-[1.15] font-bold tracking-[-0.01em]">{title}</h1>
        <p className="text-text-secondary m-0 text-[17px] leading-[1.4]">{message}</p>
      </div>
      <div className="flex flex-col gap-3">
        <PrimaryButton href={home}>Back to Mozart</PrimaryButton>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="bg-raised text-text flex h-14 w-full cursor-pointer items-center justify-center rounded-full text-[17px] leading-tight font-semibold"
          >
            Try again
          </button>
        ) : null}
      </div>
    </main>
  );
}
