import { notFound } from "next/navigation";
import { StepTwo, type StepTwoMode } from "@/components/creation/StepTwo";
import { rootTitle } from "@/lib/format";
import { getCurrentUser } from "@/lib/server/session";
import { getTrackBySlug } from "@/lib/server/tracks";

// 04-01…04-05 (creator) / 05-02…05-06 (recipient): step 2 from a player,
// track already picked. No step counter. No sign-in required.
export const instant = false;

const MODES_FROM_PLAYER: StepTwoMode[] = ["remix", "cover", "rewrite", "vibe"];

export default async function FromPlayerPage({ params }: PageProps<"/track/[slug]/[mode]">) {
  const { slug, mode } = await params;
  if (!MODES_FROM_PLAYER.includes(mode as StepTwoMode)) notFound();
  const track = await getTrackBySlug(slug);
  if (!track) notFound();
  const user = await getCurrentUser();

  const isOwner = !!user && track.ownerUserId === user.id;
  const maker = track.owner?.firstName ?? "You";
  const playerHref = `/track/${track.publicSlug}`;

  return (
    <StepTwo
      mode={mode as StepTwoMode}
      showStep={false}
      backHref={playerHref}
      subject={{
        title: track.title,
        subtitle: maker,
        initials: maker.charAt(0).toUpperCase(),
        href: playerHref,
        // The flow index names the Vibe card with an extra comma.
        label: mode === "vibe" ? `${track.title}, ${maker}, back to the player` : `${track.title} ${maker}, back to the player`,
      }}
      song={rootTitle(track.title)}
      owner={isOwner ? undefined : track.owner?.firstName}
      // TODO(M3): open the newly made track instead.
      destination={playerHref}
    />
  );
}
