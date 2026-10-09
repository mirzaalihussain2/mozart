import { notFound } from "next/navigation";
import { StepTwo, type StepTwoMode } from "@/components/creation/StepTwo";
import { rootTitle } from "@/lib/format";
import { getTrackBySlug } from "@/lib/server/tracks";
import { catalogueFor } from "@/lib/server/taste";
import { artistLabel, viewerFor } from "@/lib/server/viewer";

// 04-01…04-05 (creator) / 05-02…05-06 (recipient): step 2 from a player,
// track already picked. No step counter. No sign-in required.
//   ?saved=1   back from "Sign in to make another …": toast, then dropped from the URL
export const instant = false;

const MODES_FROM_PLAYER: StepTwoMode[] = ["remix", "cover", "rewrite", "vibe"];

export default async function FromPlayerPage({ params, searchParams }: PageProps<"/track/[slug]/[mode]">) {
  const [{ slug, mode }, query] = await Promise.all([params, searchParams]);
  if (!MODES_FROM_PLAYER.includes(mode as StepTwoMode)) notFound();
  const track = await getTrackBySlug(slug);
  if (!track) notFound();
  const viewer = await viewerFor(track);
  const maker = artistLabel(track, viewer.isAnonMaker);
  const playerHref = `/track/${track.publicSlug}`;
  const saved = query.saved === "1";

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
      owner={viewer.isOwner ? undefined : (track.owner?.firstName ?? undefined)}
      // The real id, looked up here so the client never has to fetch it.
      source={{ sourceTrackId: track.id }}
      // Signed out: Generate works once, then opens the Send-to sheet.
      signIn={viewer.signIn}
      singers={catalogueFor(viewer.user).singers}
      justSaved={saved}
      cleanHref={saved ? `${playerHref}/${mode}` : undefined}
    />
  );
}
