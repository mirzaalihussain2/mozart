"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon, PauseIcon, PlayIcon } from "@/components/icons";
import { Artwork } from "@/components/track/Artwork";

export type MiniPlayerProps = {
  slug: string;
  title: string;
  artist: string;
  playing: boolean;
  /** 0–1 */
  progress: number;
  /** Saved ✓ — only for the viewer's own track. */
  saved?: boolean;
  /** Live: drive the one <audio> (NowPlayingSlot). Without it (gallery) the icon toggles locally. */
  onToggle?: () => void;
};

/**
 * Mini player above the tab bar (CfHomePlaying / CfLibraryPlaying). On real
 * routes NowPlayingSlot feeds it from useAudio(); the gallery passes fixtures.
 */
export function MiniPlayer({ slug, title, artist, playing: playingProp, progress, saved = true, onToggle }: MiniPlayerProps) {
  const [localPlaying, setLocalPlaying] = useState(playingProp);
  const playing = onToggle ? playingProp : localPlaying;
  return (
    <div className="text-text relative mx-2 mb-2 flex h-15 shrink-0 items-center gap-2.5 overflow-hidden rounded-[10px] bg-[#3a2a24] px-2">
      {/* The whole bar opens the player; play/pause sits above the link. */}
      <Link
        href={`/track/${slug}`}
        aria-label={`Now playing: ${title} by ${artist}. Open player`}
        className="absolute inset-0 rounded-[10px]"
      />
      <Artwork variant="mini" />
      <span className="pointer-events-none flex min-w-0 flex-grow flex-col gap-px">
        <span className="truncate text-sm font-bold">{title}</span>
        <span className="text-text-secondary text-[13px]">{artist}</span>
      </span>
      {saved ? (
        <span role="img" aria-label="Saved to your library" className="pointer-events-none flex size-10 shrink-0 items-center justify-center">
          <span className="bg-accent text-on-accent flex size-6 items-center justify-center rounded-full">
            <CheckIcon size={13} strokeWidth={3.2} />
          </span>
        </span>
      ) : null}
      <button
        type="button"
        aria-label={playing ? "Pause" : "Play"}
        onClick={onToggle ?? (() => setLocalPlaying((p) => !p))}
        className="relative flex size-10 shrink-0 cursor-pointer items-center justify-center text-white after:absolute after:-inset-0.5"
      >
        {playing ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
      </button>
      <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-0.5 rounded-[1px] bg-[rgba(217,217,217,0.2)]">
        <span className="bg-text block h-0.5 rounded-[1px]" style={{ width: `${progress * 100}%` }} />
      </span>
    </div>
  );
}
