import { notFound } from "next/navigation";
import { StepTwo } from "@/components/creation/StepTwo";
import { getSong } from "@/lib/config/songs";
import { heroInitials } from "@/lib/format";
import { requireUser } from "@/lib/server/session";

// 02-02 / 02-04 / 02-06 · Step 2 with the song picked.
export const instant = false;

export default async function StepTwoPage({ params }: PageProps<"/create/[mode]/[songId]">) {
  const { mode, songId } = await params;
  if (mode !== "remix" && mode !== "cover" && mode !== "rewrite") notFound();
  const song = getSong(songId);
  if (!song) notFound();
  await requireUser();

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
      signInFallback={`/create/${mode}/${song.id}`}
    />
  );
}
