"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { Artwork, toneAt } from "@/components/track/Artwork";
import type { Song } from "@/lib/config/songs";
import { useShuffleSeed } from "@/lib/client/use-shuffle-seed";
import { gridInitials } from "@/lib/format";
import { shuffled } from "@/lib/shuffle";

/**
 * Search box + 4-column song grid (CfRemix1). Each song links to `${basePath}/${song.id}`.
 * With `shuffle`, the grid is in a random order per visit (lib/client/use-shuffle-seed.ts)
 * and stays empty until the seed is known, so the given order never flashes.
 */
export function SongPicker({ songs, basePath, shuffle = true }: { songs: Song[]; basePath: string; shuffle?: boolean }) {
  const [query, setQuery] = useState("");
  const seed = useShuffleSeed(basePath, shuffle);
  const ordered = useMemo(() => (!shuffle ? songs : seed === null ? null : shuffled(songs, seed)), [songs, shuffle, seed]);
  const q = query.trim().toLowerCase();
  const shown = (ordered ?? [])
    .map((song, k) => ({ song, tone: toneAt(k) }))
    .filter(({ song }) => !q || `${song.title} ${song.artist}`.toLowerCase().includes(q));

  return (
    <>
      <div className="bg-surface text-text-secondary mt-4 flex h-11 items-center gap-2.5 rounded-full px-3.5">
        <SearchIcon size={18} />
        <label htmlFor="song-search" className="sr-only">
          Search any song
        </label>
        <input
          id="song-search"
          type="text"
          placeholder="Search any song"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="text-text placeholder:text-[#757575] min-w-0 flex-grow self-stretch border-none bg-transparent text-[15px] outline-none"
        />
      </div>
      <div className="mt-[22px] grid grid-cols-4 gap-x-2.5 gap-y-[18px] pb-8" aria-busy={ordered === null}>
        {shown.map(({ song, tone }) => (
          <Link
            key={song.id}
            href={`${basePath}/${song.id}`}
            aria-label={`${song.title} by ${song.artist}`}
            className="text-text flex min-w-0 flex-col items-center gap-2 text-center"
          >
            <Artwork variant="grid" initials={gridInitials(song.artist)} tone={tone} src={song.imageUrl} lazy />
            <span className="line-clamp-2 w-full text-[13px] leading-[1.25] font-semibold">{song.title}</span>
          </Link>
        ))}
        {ordered !== null && shown.length === 0 ? (
          <p className="text-text-secondary col-span-4 text-center text-sm">No songs match “{query}”.</p>
        ) : null}
      </div>
    </>
  );
}
