"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon, PauseIcon, PlayIcon, PlusIcon, SendIcon, ShareIcon } from "@/components/icons";
import { ShareSheet } from "@/components/sharing/ShareSheet";
import { SignupSheet } from "@/components/sharing/SignupSheet";
import { Artwork } from "@/components/track/Artwork";
import { ModeTile } from "@/components/track/ModeTile";
import { Toast } from "@/components/ui/Toast";
import { MODES, PLAYER_MODES } from "@/lib/config/modes";
import { formatTime } from "@/lib/format";
import type { SignInPrompt, SignInReason } from "@/lib/sign-in-prompt";
import { useAudio, type AudioTrack } from "./AudioProvider";

export type PlayerVariant = "creator" | "recipient" | "recipientResult";

export type PlayerProps = {
  variant: PlayerVariant;
  slug: string;
  title: string;
  /** Maker's first name; "You" for the anonymous maker, "A friend" to anyone else. */
  artist: string;
  /** Who it's from, for "Sent by {ownerName}" (05-01). */
  ownerName: string;
  /**
   * Signed-out visitors only (absent when signed in, which hides every
   * sign-up prompt): who to "Send to", the sign-in link, and whether their
   * one anonymous make is used (then the mode tiles open the sheet).
   */
  signIn?: SignInPrompt;
  /** Absolute /track/{slug} URL for the share sheet. */
  shareUrl: string;
  /** The track's catalogue file (real routes). Drives the global <audio>. */
  audio?: { src: string; durationSec?: number };
  /** `?autoplay=1`, set only by Generate. Never for shared or library links. */
  autoplay?: boolean;
  /** Gallery: fixed playback state instead of the real audio element. */
  playback?: { playing: boolean; current: number; duration: number };
  /** `?share=1` opens the share sheet on load; "signup" is the gallery's 06-06. */
  initialSheet?: "share" | "signup";
  /**
   * `?saved=1`: back from signing in (06-07). Shows the toast once and labels
   * the chevron "Close player" (06-07 / 06-08).
   */
  justSaved?: boolean;
  /** Gallery override for the chevron's name (06-08 shows "Close player" without the toast). */
  closeLabel?: "Minimise player" | "Close player";
  /** This URL without ?share / ?saved, replaced in once they've been handled. */
  cleanHref?: string;
  /** Gallery: show the toast without the timer, and the "Copied ✓" state. */
  staticToast?: boolean;
  initialCopied?: boolean;
};

const TOAST_MS = 4000;

const STOPPED = { playing: false, current: 0, duration: 30 };

/**
 * The one player (CfPlayerSplit / CfPlayerTilesR / CfPlayerTilesResult /
 * CfPlayerSignedIn). Variants change the header and the save control.
 */
export function Player(props: PlayerProps) {
  const { variant, slug, title, artist, ownerName, signIn, shareUrl, cleanHref, staticToast, initialCopied } = props;
  const playback = props.playback ?? STOPPED;
  const router = useRouter();
  const [sheet, setSheet] = useState<"share" | SignInReason | null>(
    props.initialSheet === "signup" ? "send" : (props.initialSheet ?? null),
  );
  // Captured on first render so they survive the URL clean-up below.
  const [justSaved] = useState(!!props.justSaved);
  const [toastVisible, setToastVisible] = useState(!!props.justSaved);
  // Live audio on real routes; fixed values in the gallery.
  const a = useAudio();
  const [staticPlaying, setStaticPlaying] = useState(playback.playing);
  const src = props.playback ? undefined : props.audio?.src;
  const durationSec = props.audio?.durationSec;
  const audioTrack = useMemo<AudioTrack | null>(
    () => (src ? { slug, title, artist, src, durationSec } : null),
    [slug, title, artist, src, durationSec],
  );
  // The single <audio> may hold another track; then this player shows paused at 0:00.
  const mine = !!audioTrack && a.track?.slug === slug && a.track.src === audioTrack.src;
  const playing = audioTrack ? mine && a.playing : staticPlaying;
  const current = audioTrack ? (mine ? a.current : 0) : playback.current;
  const duration = audioTrack ? (mine && a.duration) || audioTrack.durationSec || 0 : playback.duration;

  const toggle = () => {
    if (!audioTrack) return setStaticPlaying((p) => !p);
    if (mine) return a.toggle();
    a.load(audioTrack);
    a.play();
  };
  const seek = (sec: number) => {
    if (!audioTrack) return;
    if (!mine) a.load(audioTrack);
    a.seek(sec);
  };

  // Autoplay straight after Generate only; a blocked play() just stays paused.
  const autoplayed = useRef(false);
  useEffect(() => {
    if (!props.autoplay || !audioTrack || autoplayed.current) return;
    autoplayed.current = true;
    a.load(audioTrack);
    a.play();
  }, [props.autoplay, audioTrack, a]);
  const closeLabel = props.closeLabel ?? (justSaved ? "Close player" : "Minimise player");

  useEffect(() => {
    if (cleanHref) router.replace(cleanHref, { scroll: false });
  }, [cleanHref, router]);

  useEffect(() => {
    if (!toastVisible || staticToast) return;
    const t = setTimeout(() => setToastVisible(false), TOAST_MS);
    return () => clearTimeout(t);
  }, [toastVisible, staticToast]);
  const creator = variant === "creator";
  // Their own result, or anywhere after their one make: "save your remix and send it back".
  const openSignup = () => setSheet(variant === "recipientResult" || signIn?.makeUsed ? "send" : "save");

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
                Send to {signIn?.sendTo ?? ownerName}
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
        ) : signIn ? (
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
        ) : null}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <ProgressBar current={current} duration={duration} onSeek={audioTrack ? seek : undefined} />
        <div className="text-text-secondary flex justify-between text-xs">
          <span>{formatTime(current)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        {mine && a.error ? (
          <p role="alert" className="text-text-secondary m-0 text-center text-xs">
            Couldn’t play this track.
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          aria-busy={mine && a.buffering}
          onClick={toggle}
          className="bg-accent text-on-accent flex size-16 cursor-pointer items-center justify-center rounded-full"
        >
          {playing ? <PauseIcon size={26} /> : <PlayIcon size={28} />}
        </button>
      </div>

      <div className="mt-6 flex justify-between">
        {PLAYER_MODES.map((id) => (
          <ModeTile
            key={id}
            mode={MODES[id]}
            href={`/track/${slug}/${id}`}
            // One anonymous make per visitor: after it, every tile asks them to sign in.
            onClick={signIn?.makeUsed ? () => setSheet("more") : undefined}
          />
        ))}
      </div>

      {sheet === "share" ? (
        <ShareSheet
          shareUrl={shareUrl}
          title={title}
          onClose={() => setSheet(null)}
          recipientHref={creator ? `/track/${slug}?view=recipient` : undefined}
          initialCopied={initialCopied}
        />
      ) : null}
      {sheet && sheet !== "share" && signIn ? <SignupSheet prompt={signIn} reason={sheet} onClose={() => setSheet(null)} /> : null}
      {toastVisible ? <Toast>Signed in · saved to your library</Toast> : null}
    </main>
  );
}

/**
 * Progress bar (CfPlayerSplit). With `onSeek` it's a slider: tap or drag to
 * seek, arrow keys ±5 s, Home / End.
 */
function ProgressBar({ current, duration, onSeek }: { current: number; duration: number; onSeek?: (sec: number) => void }) {
  const track = useRef<HTMLDivElement>(null);
  const progress = duration ? Math.min(current / duration, 1) : 0;

  const seekToPointer = (clientX: number) => {
    const rect = track.current?.getBoundingClientRect();
    if (!rect || !onSeek || !duration) return;
    onSeek(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration);
  };

  return (
    // 20 px hit area around the 4 px bar, without changing the layout.
    <div
      role={onSeek ? "slider" : undefined}
      aria-label={onSeek ? "Seek" : undefined}
      aria-valuemin={onSeek ? 0 : undefined}
      aria-valuemax={onSeek ? Math.round(duration) : undefined}
      aria-valuenow={onSeek ? Math.round(current) : undefined}
      aria-valuetext={onSeek ? `${formatTime(current)} of ${formatTime(duration)}` : undefined}
      tabIndex={onSeek ? 0 : undefined}
      className={`-my-2 touch-none py-2 ${onSeek ? "cursor-pointer" : ""}`}
      onPointerDown={(e) => {
        if (!onSeek) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        seekToPointer(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) seekToPointer(e.clientX);
      }}
      onKeyDown={(e) => {
        if (!onSeek) return;
        const step = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5 }[e.key];
        if (step !== undefined) onSeek(current + step);
        else if (e.key === "Home") onSeek(0);
        else if (e.key === "End") onSeek(duration);
        else return;
        e.preventDefault();
      }}
    >
      <div ref={track} className="relative h-1 rounded-sm bg-[rgba(217,217,217,0.25)]">
        <div className="bg-text h-1 rounded-sm" style={{ width: `${progress * 100}%` }} />
        <div
          className="absolute top-1/2 -mt-1.5 -ml-1.5 size-3 rounded-full bg-white"
          // CfPlayerTilesR nudges the knob to 1% at 0:00 so it isn't clipped.
          style={{ left: `${Math.max(progress * 100, 1)}%` }}
        />
      </div>
    </div>
  );
}
