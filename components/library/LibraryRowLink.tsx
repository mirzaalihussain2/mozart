"use client";

import Link from "next/link";
import { useAudio } from "@/components/audio/AudioProvider";
import { MoreIcon } from "@/components/icons";

type Props = {
  slug: string;
  label: string;
  /** Track title, for the ⋯ button's name. */
  title: string;
  last: boolean;
  /** Gallery: a fixed playing slug. Omitted on the real Library, which reads useAudio(). */
  playingSlug?: string | null;
  /** Opens the row's ⋯ menu (Share / Delete). */
  onMore: () => void;
  children: React.ReactNode;
};

/**
 * One Library row: the link to its player, then a ⋯ button (a sibling, never
 * inside the link). Outlined with aria-current when it's the loaded track
 * (CfLibraryPlaying).
 */
export function LibraryRowLink({ slug, label, title, last, playingSlug, onMore, children }: Props) {
  const a = useAudio();
  const playing = (playingSlug === undefined ? a.track?.slug : playingSlug) === slug;
  return (
    <div
      className={`flex shrink-0 items-center ${
        playing
          ? "mx-[-10px] mt-0.5 mb-1 h-19 rounded-xl border border-[rgba(242,242,242,0.9)] pl-2.5"
          : // 80 px content-box + 1 px divider, as in CfLibrary.
            last
            ? "h-20"
            : "border-raised h-[81px] border-b"
      }`}
    >
      <Link
        href={`/track/${slug}`}
        aria-label={label}
        aria-current={playing ? "true" : undefined}
        className="text-text flex h-full min-w-0 flex-grow items-center gap-3.5"
      >
        {children}
      </Link>
      <button
        type="button"
        onClick={onMore}
        aria-label={`More options for ${title}`}
        aria-haspopup="dialog"
        className={`text-text-secondary flex size-11 shrink-0 cursor-pointer items-center justify-center ${playing ? "" : "-mr-2.5"}`}
      >
        <MoreIcon size={22} strokeWidth={2.6} />
      </button>
    </div>
  );
}
