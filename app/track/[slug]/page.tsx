import { notFound } from "next/navigation";
import { Player, type PlayerVariant } from "@/components/audio/Player";
import { getCurrentUser } from "@/lib/server/session";
import { getTrackBySlug } from "@/lib/server/tracks";

// 03-05 Player · creator / 05-01 Player · recipient. No sign-in required.
export const instant = false;

export default async function TrackPage({ params, searchParams }: PageProps<"/track/[slug]">) {
  const [{ slug }, { view }] = await Promise.all([params, searchParams]);
  const track = await getTrackBySlug(slug);
  if (!track) notFound();
  const user = await getCurrentUser();

  const isOwner = !!user && track.ownerUserId === user.id;
  // ?view=recipient lets the owner see what a friend will see ("Open as recipient").
  // recipientResult (06-05) becomes reachable in milestone 5.
  const variant: PlayerVariant = isOwner && view !== "recipient" ? "creator" : "recipient";
  const ownerName = track.owner?.firstName ?? "a friend";

  return (
    <Player
      key={variant}
      variant={variant}
      slug={track.publicSlug}
      title={track.title}
      artist={track.owner?.firstName ?? "You"}
      ownerName={ownerName}
    />
  );
}
