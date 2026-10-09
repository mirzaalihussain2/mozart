"use client";

import Link from "next/link";
import { useAudio } from "@/components/audio/AudioProvider";

type Props = {
  slug: string;
  label: string;
  last: boolean;
  /** Gallery: a fixed playing slug. Omitted on the real Library, which reads useAudio(). */
  playingSlug?: string | null;
  children: React.ReactNode;
};

/** One Library row; outlined with aria-current when it's the loaded track (CfLibraryPlaying). */
export function LibraryRowLink({ slug, label, last, playingSlug, children }: Props) {
  const a = useAudio();
  const playing = (playingSlug === undefined ? a.track?.slug : playingSlug) === slug;
  return (
    <Link
      href={`/track/${slug}`}
      aria-label={label}
      aria-current={playing ? "true" : undefined}
      className={`text-text flex shrink-0 items-center gap-3.5 ${
        playing
          ? "mx-[-10px] mt-0.5 mb-1 h-19 rounded-xl border border-[rgba(242,242,242,0.9)] px-2.5"
          : // 80 px content-box + 1 px divider, as in CfLibrary.
            last
            ? "h-20"
            : "border-raised h-[81px] border-b"
      }`}
    >
      {children}
    </Link>
  );
}
