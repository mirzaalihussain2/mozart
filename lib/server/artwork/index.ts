import "server-only";
import { eq } from "drizzle-orm";
import { after } from "next/server";
import { artworkPrompt, type ArtworkBrief } from "../../config/artwork-prompts";
import { rootTitle } from "../../format";
import { db } from "../db";
import { tracks, type Track } from "../db/schema";
import { generateImage, prodiaEnabled, type InputImage } from "./prodia";
import { removeTrackArtwork, storageEnabled, upload } from "./storage";

// Album art for a new track: the original song's cover (and for Cover, the
// singer's photo) + a prompt per mode → Prodia → Supabase Storage →
// tracks.artwork_url. Everything it needs is on the track row:
// generation_input.rootImageUrl / singerImageUrl are stored at make time.
// Never fails a make: any error leaves the grey placeholder.

/** How long POST /api/generate waits for the art before answering without it. */
export const ARTWORK_WAIT_MS = 10_000;
const GENERATE_TIMEOUT_MS = 60_000;
const FETCH_TIMEOUT_MS = 5_000;
const MAX_INPUT_BYTES = 5_000_000;

/** Needs a Prodia token and Supabase Storage; ARTWORK_DISABLED=1 turns it off (e2e). */
export function artworkEnabled(): boolean {
  return prodiaEnabled() && storageEnabled() && process.env.ARTWORK_DISABLED !== "1";
}

type ArtworkTrack = Pick<Track, "id" | "mode" | "title" | "generationInput">;

/** A track made in the last minute whose art hasn't landed yet: the player keeps checking. */
export function artworkPending(track: Pick<Track, "artworkUrl" | "createdAt">, now = Date.now()): boolean {
  return !track.artworkUrl && artworkEnabled() && now - track.createdAt.getTime() < 60_000;
}

/** The images this track's art starts from, if any. */
function sourcesFor(track: ArtworkTrack) {
  const gi = track.generationInput;
  return { cover: gi.rootImageUrl ?? null, singer: track.mode === "cover" ? (gi.singerImageUrl ?? null) : null };
}

/** The prompt's inputs from the stored request, given which images could be fetched. */
export function briefFor(track: ArtworkTrack, has: { cover: boolean; singer: boolean }): ArtworkBrief {
  const gi = track.generationInput;
  const song = gi.rootSong ?? rootTitle(track.title);
  const artist = gi.rootArtist ?? "";
  switch (track.mode) {
    case "remix":
      return { mode: "remix", song, artist, genreId: gi.genreId ?? "", cover: has.cover };
    case "cover":
      return { mode: "cover", song, artist, singer: gi.label ?? "", cover: has.cover, singerPhoto: has.singer };
    case "rewrite":
      return { mode: "rewrite", song, artist, themeId: gi.themeId ?? "", cover: has.cover };
    case "vibe":
      return { mode: "vibe", song, artist, text: gi.text ?? "", cover: has.cover };
    case "new":
      return { mode: "new", text: gi.text ?? track.title };
  }
}

async function fetchImage(url: string | null, name: string): Promise<InputImage | null> {
  if (!url?.startsWith("https://")) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.startsWith("image/")) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    return bytes.length <= MAX_INPUT_BYTES ? { name, bytes, contentType } : null;
  } catch {
    return null;
  }
}

/** Generates a track's art as a JPEG (not stored). Throws on failure. */
export async function renderArtwork(track: ArtworkTrack): Promise<Uint8Array<ArrayBuffer>> {
  const src = sourcesFor(track);
  const [cover, singer] = await Promise.all([fetchImage(src.cover, "cover.jpg"), fetchImage(src.singer, "singer.jpg")]);
  const { prompt, images } = artworkPrompt(briefFor(track, { cover: !!cover, singer: !!singer }));
  const inputs = images.map((i) => (i === "cover" ? cover! : singer!));
  return generateImage(prompt, inputs, AbortSignal.timeout(GENERATE_TIMEOUT_MS));
}

/** Generates, stores and saves a track's art; its URL, or null on any failure. */
export async function makeArtwork(track: ArtworkTrack): Promise<string | null> {
  try {
    const started = Date.now();
    const jpeg = await renderArtwork(track);
    const url = await upload(`tracks/${track.id}-${crypto.randomUUID().slice(0, 8)}.jpg`, jpeg, "image/jpeg");
    const [row] = await db.update(tracks).set({ artworkUrl: url }).where(eq(tracks.id, track.id)).returning({ id: tracks.id });
    // Deleted while it was being made: don't leave the image behind.
    if (!row) {
      await removeTrackArtwork([url]);
      return null;
    }
    console.log(`artwork: ${track.mode} ${track.id} in ${Date.now() - started} ms`);
    return url;
  } catch (err) {
    console.error(`artwork: ${track.mode} ${track.id} failed`, err);
    return null;
  }
}

/**
 * For POST /api/generate: makes the art, waiting up to ARTWORK_WAIT_MS. If it
 * isn't ready by then, the request answers without it and the job carries on
 * after the response; the player picks it up when it lands.
 */
export async function artworkForNewTrack(track: ArtworkTrack): Promise<void> {
  if (!artworkEnabled()) return;
  const job = makeArtwork(track);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const waited = new Promise<"late">((resolve) => (timer = setTimeout(() => resolve("late"), ARTWORK_WAIT_MS)));
  const first = await Promise.race([job.then(() => "done" as const), waited]);
  clearTimeout(timer);
  if (first === "late") after(() => job);
}
