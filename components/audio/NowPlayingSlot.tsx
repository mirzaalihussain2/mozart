"use client";

import { usePathname } from "next/navigation";
import { showsMiniPlayer } from "@/lib/audio-routes";
import { useAudio } from "./AudioProvider";
import { MiniPlayer } from "./MiniPlayer";

/**
 * The live mini player on /create and /library (01-03, 07-02): whatever's
 * loaded in the one <audio>, playing or paused; nothing when no track is.
 */
export function NowPlayingSlot() {
  const a = useAudio();
  const pathname = usePathname();
  if (!a.track || !showsMiniPlayer(pathname)) return null;
  const duration = a.duration || a.track.durationSec || 0;
  return (
    <MiniPlayer
      slug={a.track.slug}
      title={a.track.title}
      artist={a.track.artist}
      playing={a.playing}
      progress={duration ? Math.min(a.current / duration, 1) : 0}
      saved={!!a.track.isOwn}
      artworkUrl={a.track.artworkUrl}
      onToggle={a.toggle}
    />
  );
}
