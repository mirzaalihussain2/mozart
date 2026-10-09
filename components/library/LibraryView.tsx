import { MiniPlayer, type MiniPlayerProps } from "@/components/audio/MiniPlayer";
import { NowPlayingSlot } from "@/components/audio/NowPlayingSlot";
import { TabBar } from "@/components/navigation/TabBar";
import { TabHeader } from "@/components/navigation/TabHeader";
import { Artwork } from "@/components/track/Artwork";
import { PrimaryButton } from "@/components/ui/Buttons";
import { LibraryRowLink } from "./LibraryRowLink";

export type LibraryRow = {
  slug: string;
  title: string;
  /** Mode label shown on derived tracks, e.g. "REMIX". */
  badge?: string;
  dateLabel: string;
};

type Props = {
  /** The signed-in user's initial, for the profile menu. */
  initial: string;
  rows: LibraryRow[];
  /** Real route: the live mini player and row outline from useAudio(). */
  live?: boolean;
  /** Gallery: a fixed "now playing" for 07-02. */
  nowPlaying?: MiniPlayerProps;
};

/**
 * 07-01 Library (CfLibrary); with a mini player it's 07-02 (CfLibraryPlaying).
 * Departs from the designs on purpose: the header is the Create home's
 * (TabHeader), and an empty library points to Create.
 */
export function LibraryView({ initial, rows, live = false, nowPlaying }: Props) {
  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <TabHeader initial={initial} title="Library" subtitle={`${rows.length} ${rows.length === 1 ? "track" : "tracks"}`} />
      {rows.length === 0 ? (
        <div className="flex flex-grow flex-col items-center justify-center gap-5 px-5 pb-10">
          <p className="text-text-secondary m-0 text-[17px] leading-[1.4]">Nothing here yet</p>
          <PrimaryButton href="/create">Make your first track</PrimaryButton>
        </div>
      ) : (
        <div className="flex min-h-0 flex-grow flex-col overflow-y-auto px-5 pt-3">
          {rows.map((row, i) => (
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
          ))}
        </div>
      )}
      {live ? <NowPlayingSlot /> : nowPlaying ? <MiniPlayer {...nowPlaying} /> : null}
      <TabBar active="library" />
    </main>
  );
}
