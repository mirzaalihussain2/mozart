import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Player, type PlayerVariant } from "@/components/audio/Player";
import { getAudioByFile } from "@/lib/config/audio-catalogue";
import { trackUrl } from "@/lib/server/app-url";
import { getCurrentUser } from "@/lib/server/session";
import { getTrackBySlug } from "@/lib/server/tracks";

// 03-05 Player · creator / 05-01 Player · recipient. No sign-in required.
//   ?view=recipient   the owner previews what a friend sees ("Open as recipient")
//   ?share=1          open the share sheet on load
//   ?saved=1          back from signing in: toast + "Close player" (06-07)
//   ?autoplay=1       straight after Generate: start playing (never otherwise)
export const instant = false;

const DESCRIPTION = "Listen, then make your own version on Mozart.";

/**
 * Link previews (WhatsApp, iMessage …). Same for every viewer — crawlers have
 * no cookies — and noindex: reachable by link, not by search. The image comes
 * from ./opengraph-image.tsx and ./twitter-image.tsx.
 */
export async function generateMetadata({ params }: PageProps<"/track/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const track = await getTrackBySlug(slug);
  if (!track) return { title: "Track not found · Mozart", robots: { index: false, follow: false } };

  const title = `${track.title} · ${track.owner?.firstName ?? "Someone"} on Mozart`;
  const url = await trackUrl(track.publicSlug);
  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical: url },
    openGraph: { type: "music.song", siteName: "Mozart", title, description: DESCRIPTION, url },
    twitter: { card: "summary_large_image", title, description: DESCRIPTION },
    robots: { index: false, follow: false },
  };
}

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

  return (
    <Player
      key={variant}
      variant={variant}
      slug={track.publicSlug}
      title={track.title}
      artist={track.owner?.firstName ?? "You"}
      ownerName={track.owner?.firstName ?? "a friend"}
      shareUrl={await trackUrl(track.publicSlug)}
      initialSheet={share ? "share" : undefined}
      justSaved={saved}
      audio={{ src: track.audioUrl, durationSec: getAudioByFile(track.audioUrl)?.durationSec }}
      autoplay={autoplay}
      // Drop ?share / ?saved / ?autoplay once handled so a refresh doesn't repeat them.
      cleanHref={share || saved || autoplay ? (view ? `${path}?view=recipient` : path) : undefined}
    />
  );
}
