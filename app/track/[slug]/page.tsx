import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Player, type PlayerVariant } from "@/components/audio/Player";
import { getAudioByFile } from "@/lib/config/audio-catalogue";
import { getCurrentUser } from "@/lib/server/session";
import { getTrackBySlug } from "@/lib/server/tracks";

// 03-05 Player · creator / 05-01 Player · recipient. No sign-in required.
//   ?view=recipient   the owner previews what a friend sees ("Open as recipient")
//   ?share=1          open the share sheet on load
//   ?saved=1          back from signing in: toast + "Close player" (06-07)
//   ?autoplay=1       straight after Generate: start playing (never otherwise)
export const instant = false;

export default async function TrackPage({ params, searchParams }: PageProps<"/track/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const track = await getTrackBySlug(slug);
  if (!track) notFound();
  const user = await getCurrentUser();

  const view = query.view === "recipient" ? "recipient" : undefined;
  const share = query.share === "1";
  const saved = query.saved === "1";
  const autoplay = query.autoplay === "1";
  const isOwner = !!user && track.ownerUserId === user.id;
  // recipientResult (06-05) becomes reachable in milestone 5.
  const variant: PlayerVariant = isOwner && !view ? "creator" : "recipient";

  const path = `/track/${track.publicSlug}`;
  const host = (await headers()).get("host");
  const origin = process.env.APP_URL ?? (host ? `http://${host}` : "");

  return (
    <Player
      key={variant}
      variant={variant}
      slug={track.publicSlug}
      title={track.title}
      artist={track.owner?.firstName ?? "You"}
      ownerName={track.owner?.firstName ?? "a friend"}
      shareUrl={`${origin}${path}`}
      initialSheet={share ? "share" : undefined}
      justSaved={saved}
      audio={{ src: track.audioUrl, durationSec: getAudioByFile(track.audioUrl)?.durationSec }}
      autoplay={autoplay}
      // Drop ?share / ?saved / ?autoplay once handled so a refresh doesn't repeat them.
      cleanHref={share || saved || autoplay ? (view ? `${path}?view=recipient` : path) : undefined}
    />
  );
}
