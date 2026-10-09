import Link from "next/link";
import { MiniPlayer, type MiniPlayerProps } from "@/components/audio/MiniPlayer";
import { TabBar } from "@/components/navigation/TabBar";
import { Artwork } from "@/components/track/Artwork";

export type LibraryRow = {
  slug: string;
  title: string;
  /** Mode label shown on derived tracks, e.g. "REMIX". */
  badge?: string;
  dateLabel: string;
};

/** 07-01 Library (CfLibrary); with a mini player it's 07-02 (CfLibraryPlaying). */
export function LibraryView({ rows, nowPlaying }: { rows: LibraryRow[]; nowPlaying?: MiniPlayerProps }) {
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
          const playing = nowPlaying?.slug === row.slug;
          const last = i === rows.length - 1;
          return (
            <Link
              key={row.slug}
              href={`/track/${row.slug}`}
              aria-label={[row.title, row.badge, row.dateLabel].filter(Boolean).join(" ")}
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
            </Link>
          );
        })}
      </div>
      {nowPlaying ? <MiniPlayer {...nowPlaying} /> : null}
      <TabBar active="library" />
    </main>
  );
}
