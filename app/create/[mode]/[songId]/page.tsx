import { notFound } from "next/navigation";
import { StepTwo } from "@/components/creation/StepTwo";

import { heroInitials } from "@/lib/format";
import { findSong } from "@/lib/config/songs";
import { requireUser } from "@/lib/server/session";
import { catalogueFor } from "@/lib/server/taste";

// 02-02 / 02-04 / 02-06 · Step 2 with the song picked.
export const instant = false;

export default async function StepTwoPage({ params }: PageProps<"/create/[mode]/[songId]">) {
  const { mode, songId } = await params;
  if (mode !== "remix" && mode !== "cover" && mode !== "rewrite") notFound();
  const user = await requireUser();
  const catalogue = catalogueFor(user);
  // The viewer's own songs (22-char Spotify ids, or mock-track-NN).
  const song = findSong(catalogue.songs, songId);
  if (!song) notFound();

  return (
    <StepTwo
      mode={mode}
      showStep
      backHref={`/create/${mode}`}
      subject={{
        title: song.title,
        subtitle: song.artist,
        initials: heroInitials(song.artist),
        href: `/create/${mode}`,
        label: `${song.title} by ${song.artist}, change song`,
      }}
      song={song.title}
      source={{ sourceSongId: song.id }}
      singers={catalogue.singers}
    />
  );
}
