import { StepHeader } from "@/components/navigation/StepHeader";
import type { Mode } from "@/lib/config/modes";
import type { Song } from "@/lib/config/songs";
import { SongPicker } from "./SongPicker";

const VERB: Record<string, string> = { remix: "remix", cover: "cover", rewrite: "rewrite" };

/** Step 1 · Pick a song (02-01 / 02-03 / 02-05). */
export function StepOne({ mode, songs }: { mode: Mode; songs: Song[] }) {
  return (
    <main className="flex min-h-dvh flex-col px-4 pt-12">
      <StepHeader mode={mode} backHref="/create" step={1} />
      <div className="mt-3 flex flex-col gap-1 px-1">
        <h1 className="m-0 text-[28px] leading-[1.12] font-bold">Pick a song to {VERB[mode.id]}</h1>
        <p className="text-text-secondary m-0 truncate text-[15px]">{mode.tagline}</p>
      </div>
      <SongPicker songs={songs} basePath={`/create/${mode.id}`} />
    </main>
  );
}
