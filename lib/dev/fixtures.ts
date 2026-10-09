import type { MiniPlayerProps } from "@/components/audio/MiniPlayer";
import type { StepTwoMode, StepTwoProps } from "@/components/creation/StepTwo";
import type { LibraryRow } from "@/components/library/LibraryView";
import { getSong, SONGS } from "@/lib/config/songs";
import { heroInitials } from "@/lib/format";

// Fixed data for the dev gallery, matching what the designs show.

export const NOW_PLAYING: MiniPlayerProps = {
  slug: "cruel-bolly",
  title: "Cruel Summer × Bollywood",
  artist: "Ali",
  playing: true,
  progress: 0.38,
};

// 07-01 as designed, with the dates frozen to the PNG.
export const LIBRARY_ROWS: LibraryRow[] = [
  { slug: "cruel-bolly", title: "Cruel Summer × Bollywood", dateLabel: "Today" },
  { slug: "cruel-electro", title: "Cruel Summer × Electronic", badge: "REMIX", dateLabel: "Today" },
  { slug: "deep-bolly", title: "In Too Deep × Bollywood", dateLabel: "Yesterday" },
  { slug: "euphoric-pop", title: "Euphoric electronic pop", dateLabel: "3 Oct" },
  { slug: "cinematic-pop", title: "Cinematic pop", dateLabel: "1 Oct" },
  { slug: "deep-lofi", title: "In Too Deep × Lo-fi", badge: "REMIX", dateLabel: "28 Sep" },
];

const songByTitle = (title: string) => getSong(SONGS.find((s) => s.title === title)!.id)!;

/** Step 2 from the Create flow with a picked song (02-02 / 02-04 / 02-06). */
export function createStepTwo(mode: StepTwoMode, title: string, choice: string): StepTwoProps {
  const song = songByTitle(title);
  return {
    mode,
    showStep: true,
    backHref: `/create/${mode}`,
    subject: {
      title: song.title,
      subtitle: song.artist,
      initials: heroInitials(song.artist),
      href: `/create/${mode}`,
      label: `${song.title} by ${song.artist}, change song`,
    },
    song: song.title,
    destination: "/track/cruel-bolly",
    initialChoice: choice,
  };
}

/** Step 2 from a player on Cruel Summer × Bollywood (04-xx creator, 05-xx recipient). */
export function playerStepTwo(mode: StepTwoMode, recipient: boolean, extra: Partial<StepTwoProps> = {}): StepTwoProps {
  const title = "Cruel Summer × Bollywood";
  return {
    mode,
    showStep: false,
    backHref: "/track/cruel-bolly",
    subject: {
      title,
      subtitle: "Ali",
      initials: "A",
      href: "/track/cruel-bolly",
      // The flow index names the Vibe card with an extra comma.
      label: mode === "vibe" ? `${title}, Ali, back to the player` : `${title} Ali, back to the player`,
    },
    song: "Cruel Summer",
    owner: recipient ? "Ali" : undefined,
    destination: "/track/cruel-bolly",
    ...extra,
  };
}

export const NEW_TYPED = "A sad garage song about the night bus home";
export const VIBE_TYPED = "Make it a stripped-back acoustic version for a rainy Sunday";
