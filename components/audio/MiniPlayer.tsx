import Link from "next/link";
import { CheckIcon, PauseIcon, PlayIcon } from "@/components/icons";
import { Artwork } from "@/components/track/Artwork";

export type MiniPlayerProps = {
  slug: string;
  title: string;
  artist: string;
  playing: boolean;
  /** 0–1 */
  progress: number;
};

/**
 * Mini player above the tab bar (CfHomePlaying / CfLibraryPlaying). Static in
 * milestone 2; milestone 6 drives it from the global AudioProvider.
 */
export function MiniPlayer({ slug, title, artist, playing, progress }: MiniPlayerProps) {
  return (
    <Link
      href={`/track/${slug}`}
      aria-label={`Now playing: ${title} by ${artist}. Open player`}
      className="text-text relative mx-2 mb-2 flex h-15 shrink-0 items-center gap-2.5 overflow-hidden rounded-[10px] bg-[#3a2a24] px-2"
    >
      <Artwork variant="mini" />
      <span className="flex min-w-0 flex-grow flex-col gap-px">
        <span className="truncate text-sm font-bold">{title}</span>
        <span className="text-text-secondary text-[13px]">{artist}</span>
      </span>
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center">
        <span className="bg-accent text-on-accent flex size-6 items-center justify-center rounded-full">
          <CheckIcon size={13} strokeWidth={3.2} />
        </span>
      </span>
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center text-white">
        {playing ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
      </span>
      <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-0.5 rounded-[1px] bg-[rgba(217,217,217,0.2)]">
        <span className="bg-text block h-0.5 rounded-[1px]" style={{ width: `${progress * 100}%` }} />
      </span>
    </Link>
  );
}
