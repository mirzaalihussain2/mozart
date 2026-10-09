import { MiniPlayer, type MiniPlayerProps } from "@/components/audio/MiniPlayer";
import { NowPlayingSlot } from "@/components/audio/NowPlayingSlot";
import { ModeCard } from "@/components/creation/ModeCard";
import { TabBar } from "@/components/navigation/TabBar";
import { TabHeader } from "@/components/navigation/TabHeader";
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
      <TabHeader
        initial={initial}
        avatarUrl={avatarUrl}
        title="What do you want to make?"
        subtitle="Pick a song you love or describe something new."
      />
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
