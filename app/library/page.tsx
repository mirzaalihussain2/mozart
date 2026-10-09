import { LibraryView } from "@/components/library/LibraryView";
import { MODES } from "@/lib/config/modes";
import { relativeDay } from "@/lib/format";
import { requireUser } from "@/lib/server/session";
import { listLibrary } from "@/lib/server/tracks";

// 07-01 Library.
export const instant = false;

export default async function LibraryPage() {
  const user = await requireUser();
  const tracks = await listLibrary(user.id);
  const now = new Date();
  return (
    <LibraryView
      live
      initial={user.firstName.slice(0, 1).toUpperCase()}
      rows={tracks.map((t) => ({
        slug: t.publicSlug,
        title: t.title,
        // The design badges tracks made from another track ("REMIX").
        badge: t.sourceTrackId ? MODES[t.mode].label.toUpperCase() : undefined,
        dateLabel: relativeDay(t.createdAt, now),
      }))}
    />
  );
}
