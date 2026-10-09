import type { MiniPlayerProps } from "@/components/audio/MiniPlayer";
import type { LibraryRow } from "@/components/library/LibraryView";

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
