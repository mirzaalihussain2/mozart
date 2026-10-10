"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import { MiniPlayer, type MiniPlayerProps } from "@/components/audio/MiniPlayer";
import { NowPlayingSlot } from "@/components/audio/NowPlayingSlot";
import { TabBar } from "@/components/navigation/TabBar";
import { TabHeader } from "@/components/navigation/TabHeader";
import { ShareSheet } from "@/components/sharing/ShareSheet";
import { Artwork } from "@/components/track/Artwork";
import { PrimaryButton } from "@/components/ui/Buttons";
import { LibraryRowLink } from "./LibraryRowLink";
import { TrackActionsSheet } from "./TrackActionsSheet";

export type LibraryRow = {
  slug: string;
  title: string;
  /** Mode label shown on derived tracks, e.g. "REMIX". */
  badge?: string;
  dateLabel: string;
  /** The absolute /track/{slug} URL, for Share in the ⋯ menu. */
  shareUrl: string;
  /** The track's album art; null shows the plain grey square. */
  artworkUrl?: string | null;
};

type Props = {
  /** The signed-in user's initial and Spotify photo, for the profile menu. */
  initial: string;
  avatarUrl?: string | null;
  rows: LibraryRow[];
  /** Real route: the live mini player and row outline from useAudio(). */
  live?: boolean;
  /** Gallery: a fixed "now playing" for 07-02. */
  nowPlaying?: MiniPlayerProps;
  /** Gallery: a row whose ⋯ menu starts open. */
  initialMenu?: string;
};

/**
 * 07-01 Library (CfLibrary); with a mini player it's 07-02 (CfLibraryPlaying).
 * Departs from the designs on purpose: the header is the Create home's
 * (TabHeader), an empty library points to Create, and each row has a ⋯ menu
 * (Share / Delete). A deleted row disappears at once; the server refresh
 * follows.
 */
export function LibraryView({ initial, avatarUrl, rows, live = false, nowPlaying, initialMenu }: Props) {
  const router = useRouter();
  const audio = useAudio();
  const [menu, setMenu] = useState<LibraryRow | null>(() => rows.find((r) => r.slug === initialMenu) ?? null);
  const [sharing, setSharing] = useState<LibraryRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [deleted, setDeleted] = useState<string[]>([]);
  const shown = rows.filter((r) => !deleted.includes(r.slug));

  const openMenu = (row: LibraryRow) => {
    setFailed(false);
    setMenu(row);
  };

  const remove = async (row: LibraryRow) => {
    if (!live) return; // the gallery never deletes
    setDeleting(true);
    setFailed(false);
    const res = await fetch(`/api/tracks/${encodeURIComponent(row.slug)}`, { method: "DELETE" }).catch(() => null);
    setDeleting(false);
    // 404: already gone (another tab) — treat as deleted.
    if (!res || (!res.ok && res.status !== 404)) return setFailed(true);
    if (audio.track?.slug === row.slug) audio.stop();
    setDeleted((d) => [...d, row.slug]);
    setMenu(null);
    router.refresh();
  };

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <TabHeader initial={initial} avatarUrl={avatarUrl} title="Library" subtitle={`${shown.length} ${shown.length === 1 ? "track" : "tracks"}`} />
      {shown.length === 0 ? (
        <div className="flex flex-grow flex-col items-center justify-center gap-5 px-5 pb-10">
          <p className="text-text-secondary m-0 text-[17px] leading-[1.4]">Nothing here yet</p>
          <PrimaryButton href="/create">Make your first track</PrimaryButton>
        </div>
      ) : (
        <div className="flex min-h-0 flex-grow flex-col overflow-y-auto px-5 pt-3">
          {shown.map((row, i) => (
            <LibraryRowLink
              key={row.slug}
              slug={row.slug}
              label={[row.title, row.badge, row.dateLabel].filter(Boolean).join(" ")}
              title={row.title}
              last={i === shown.length - 1}
              playingSlug={live ? undefined : (nowPlaying?.slug ?? null)}
              onMore={() => openMenu(row)}
            >
              <Artwork variant="list" src={row.artworkUrl} lazy />
              <div className="flex min-w-0 flex-grow flex-col gap-[3px]">
                <div className="truncate text-base font-semibold">{row.title}</div>
                <div className="text-text-secondary flex items-center gap-2 text-[13px]">
                  {row.badge ? (
                    <span className="text-text-secondary flex h-[22px] items-center rounded-[10px] border border-[#737373] px-[7px] text-[11px] font-semibold">
                      {row.badge}
                    </span>
                  ) : null}
                  {row.dateLabel}
                </div>
              </div>
            </LibraryRowLink>
          ))}
        </div>
      )}
      {live ? <NowPlayingSlot /> : nowPlaying ? <MiniPlayer {...nowPlaying} /> : null}
      <TabBar active="library" />
      {menu ? (
        <TrackActionsSheet
          title={menu.title}
          deleting={deleting}
          failed={failed}
          onClose={() => setMenu(null)}
          onShare={() => {
            setMenu(null);
            setSharing(menu);
          }}
          onDelete={() => void remove(menu)}
        />
      ) : null}
      {sharing ? (
        <ShareSheet
          shareUrl={sharing.shareUrl}
          title={sharing.title}
          recipientHref={`/track/${sharing.slug}?view=recipient`}
          onClose={() => setSharing(null)}
        />
      ) : null}
    </main>
  );
}
