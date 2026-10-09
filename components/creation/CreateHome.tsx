import { MiniPlayer, type MiniPlayerProps } from "@/components/audio/MiniPlayer";
import { NowPlayingSlot } from "@/components/audio/NowPlayingSlot";
import { ModeCard } from "@/components/creation/ModeCard";
import { ProfileMenu } from "@/components/navigation/ProfileMenu";
import { TabBar } from "@/components/navigation/TabBar";
import { HOME_MODES, MODES } from "@/lib/config/modes";

const HREF = { remix: "/create/remix", cover: "/create/cover", rewrite: "/create/rewrite", new: "/create/new" } as const;

/**
 * 01-02 Create home (CfHome); with a mini player it's 01-03 (CfHomePlaying).
 * `live` (the real route) shows whatever's loaded; the gallery passes `nowPlaying`.
 */
export function CreateHome({
  initial,
  avatarUrl,
  live = false,
  nowPlaying,
}: {
  initial: string;
  avatarUrl?: string | null;
  live?: boolean;
  nowPlaying?: MiniPlayerProps;
}) {
  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <div className="flex flex-col gap-5 px-5 pt-14">
        <div className="flex items-center justify-between">
          <div className="text-[22px] font-bold tracking-[-0.01em]">Mozart</div>
          <ProfileMenu initial={initial} avatarUrl={avatarUrl} />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-2xl leading-[1.15] font-bold whitespace-nowrap">What do you want to make?</h1>
          <p className="text-text-secondary m-0 text-[15px] leading-[1.4] whitespace-nowrap">
            Pick a song you love or describe something new.
          </p>
        </div>
      </div>
      <div className="flex flex-grow flex-col gap-3 px-5 pt-5">
        {HOME_MODES.map((id) => (
          <ModeCard key={id} mode={MODES[id]} href={HREF[id as keyof typeof HREF]} />
        ))}
      </div>
      {live ? <NowPlayingSlot /> : nowPlaying ? <MiniPlayer {...nowPlaying} /> : null}
      <TabBar active="create" />
    </main>
  );
}
