"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon, ChevronDownIcon, PauseIcon, PlayIcon, PlusIcon, SendIcon, ShareIcon } from "@/components/icons";
import { ShareSheet } from "@/components/sharing/ShareSheet";
import { SignupSheet } from "@/components/sharing/SignupSheet";
import { Artwork } from "@/components/track/Artwork";
import { ModeTile } from "@/components/track/ModeTile";
import { Toast } from "@/components/ui/Toast";
import { MODES, PLAYER_MODES } from "@/lib/config/modes";
import { formatTime } from "@/lib/format";

export type PlayerVariant = "creator" | "recipient" | "recipientResult";

export type PlayerProps = {
  variant: PlayerVariant;
  slug: string;
  title: string;
  /** Maker's first name, or "You" for an anonymous maker. */
  artist: string;
  /** Who sent it ("Sent by Ali" / "Send to Ali"). */
  ownerName: string;
  /** "Minimise player" normally; "Close player" right after signing in (06-07 / 06-08). */
  closeLabel?: "Minimise player" | "Close player";
  /** Static until milestone 3 wires real audio. */
  playback?: { playing: boolean; current: number; duration: number };
  initialSheet?: "share" | "signup";
  toast?: string;
  initialCopied?: boolean;
};

const STOPPED = { playing: false, current: 0, duration: 30 };

/**
 * The one player (CfPlayerSplit / CfPlayerTilesR / CfPlayerTilesResult /
 * CfPlayerSignedIn). Variants change the header and the save control.
 */
export function Player(props: PlayerProps) {
  const { variant, slug, title, artist, ownerName, closeLabel = "Minimise player", toast, initialCopied } = props;
  const playback = props.playback ?? STOPPED;
  const [sheet, setSheet] = useState<"share" | "signup" | null>(props.initialSheet ?? null);
  const progress = playback.duration ? playback.current / playback.duration : 0;
  const creator = variant === "creator";
  const openSignup = () => setSheet("signup");

  return (
    <main className="flex h-dvh min-h-[760px] flex-col bg-[linear-gradient(180deg,#3a2a24_0%,#1c1716_48%,#121212_100%)] px-6 pt-[52px] pb-8">
      <div className="flex h-12 items-center justify-between gap-2">
        {creator ? (
          <>
            <Link
              href="/library"
              aria-label={closeLabel}
              className="text-text -ml-2 flex size-11 items-center justify-center rounded-full"
            >
              <ChevronDownIcon size={26} />
            </Link>
            <div className="flex min-w-0 flex-col items-center gap-px">
              <span className="text-text-secondary text-xs">Playing from</span>
              <span className="text-[15px] font-bold">Your library</span>
            </div>
            <button
              type="button"
              aria-label="Share"
              onClick={() => setSheet("share")}
              className="text-text -mr-2 flex size-11 cursor-pointer items-center justify-center rounded-full"
            >
              <ShareIcon size={24} />
            </button>
          </>
        ) : (
          <>
            <Link href="/" className="text-text flex h-11 w-16 items-center text-[15px] font-bold tracking-[0.01em]">
              Mozart
            </Link>
            {variant === "recipient" ? (
              <span
                role="status"
                className="border-border text-text-secondary flex h-9 w-32 items-center justify-center gap-1.5 rounded-full border-[1.5px] text-sm font-bold whitespace-nowrap"
              >
                <SendIcon size={16} strokeWidth={2.2} />
                Sent by {ownerName}
              </span>
            ) : (
              <button
                type="button"
                onClick={openSignup}
                className="bg-accent text-on-accent relative flex h-9 w-32 cursor-pointer items-center justify-center gap-1.5 rounded-full text-sm font-bold whitespace-nowrap after:absolute after:-inset-y-1 after:inset-x-0"
              >
                <SendIcon size={16} strokeWidth={2.2} />
                Send to {ownerName}
              </button>
            )}
          </>
        )}
      </div>

      <div role="img" aria-label="Cover art" className="mt-4 self-center">
        <Artwork variant="cover" />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex min-w-0 flex-grow flex-col gap-0.5">
          <h1 className="m-0 truncate text-[22px] leading-[1.25] font-bold">{title}</h1>
          <div className="text-text-secondary text-base">{artist}</div>
        </div>
        {creator ? (
          <button
            type="button"
            aria-label="Saved to your library"
            className="-mr-1.5 flex size-11 shrink-0 items-center justify-center"
          >
            <span className="bg-accent text-on-accent flex size-[30px] items-center justify-center rounded-full">
              <CheckIcon size={16} strokeWidth={3} />
            </span>
          </button>
        ) : (
          <button
            type="button"
            aria-label="Save to your library (sign up)"
            onClick={openSignup}
            className="text-text -mr-1.5 flex size-11 shrink-0 cursor-pointer items-center justify-center"
          >
            <span className="border-text-secondary flex size-[30px] items-center justify-center rounded-full border-2">
              <PlusIcon size={14} strokeWidth={3} />
            </span>
          </button>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <div className="relative h-1 rounded-sm bg-[rgba(217,217,217,0.25)]">
          <div className="bg-text h-1 rounded-sm" style={{ width: `${progress * 100}%` }} />
          <div
            className="absolute top-1/2 -mt-1.5 -ml-1.5 size-3 rounded-full bg-white"
            // CfPlayerTilesR nudges the knob to 1% at 0:00 so it isn't clipped.
            style={{ left: `${Math.max(progress * 100, 1)}%` }}
          />
        </div>
        <div className="text-text-secondary flex justify-between text-xs">
          <span>{formatTime(playback.current)}</span>
          <span>{formatTime(playback.duration)}</span>
        </div>
      </div>

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          aria-label={playback.playing ? "Pause" : "Play"}
          // TODO(M3): drive the global <audio> element.
          className="bg-accent text-on-accent flex size-16 cursor-pointer items-center justify-center rounded-full"
        >
          {playback.playing ? <PauseIcon size={26} /> : <PlayIcon size={28} />}
        </button>
      </div>

      <div className="mt-6 flex justify-between">
        {PLAYER_MODES.map((id) => (
          <ModeTile key={id} mode={MODES[id]} href={`/track/${slug}/${id}`} />
        ))}
      </div>

      {sheet === "share" ? (
        <ShareSheet
          onClose={() => setSheet(null)}
          recipientHref={creator ? `/track/${slug}?view=recipient` : undefined}
          initialCopied={initialCopied}
        />
      ) : null}
      {sheet === "signup" ? (
        <SignupSheet
          ownerName={ownerName}
          signInHref={`/auth/spotify/login?returnTo=${encodeURIComponent(`/track/${slug}`)}`}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {toast ? <Toast>{toast}</Toast> : null}
    </main>
  );
}
