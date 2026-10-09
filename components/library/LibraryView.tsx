import { MiniPlayer, type MiniPlayerProps } from "@/components/audio/MiniPlayer";
import { NowPlayingSlot } from "@/components/audio/NowPlayingSlot";
import { TabBar } from "@/components/navigation/TabBar";
import { Artwork } from "@/components/track/Artwork";
import { LibraryRowLink } from "./LibraryRowLink";

export type LibraryRow = {
  slug: string;
  title: string;
  /** Mode label shown on derived tracks, e.g. "REMIX". */
  badge?: string;
  dateLabel: string;
};

type Props = {
  rows: LibraryRow[];
  /** Real route: the live mini player and row outline from useAudio(). */
  live?: boolean;
  /** Gallery: a fixed "now playing" for 07-02. */
  nowPlaying?: MiniPlayerProps;
};

/** 07-01 Library (CfLibrary); with a mini player it's 07-02 (CfLibraryPlaying). */
export function LibraryView({ rows, live = false, nowPlaying }: Props) {
  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <div className="flex flex-col gap-1 px-5 pt-[52px] pb-3">
        <h1 className="m-0 text-[28px] font-bold">Library</h1>
        <div className="text-text-secondary text-[15px]">
          {rows.length} {rows.length === 1 ? "track" : "tracks"}
        </div>
      </div>
      <div className="flex min-h-0 flex-grow flex-col overflow-y-auto px-5">
        {rows.map((row, i) => {
          return (
            <LibraryRowLink
              key={row.slug}
              slug={row.slug}
              label={[row.title, row.badge, row.dateLabel].filter(Boolean).join(" ")}
              last={i === rows.length - 1}
              playingSlug={live ? undefined : (nowPlaying?.slug ?? null)}
            >
              <Artwork variant="list" />
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
          );
        })}
      </div>
      {live ? <NowPlayingSlot /> : nowPlaying ? <MiniPlayer {...nowPlaying} /> : null}
      <TabBar active="library" />
    </main>
  );
}
