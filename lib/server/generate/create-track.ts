import "server-only";
import { and, count, eq, gt, isNull } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { findSong } from "@/lib/config/songs";
import { rootTitle } from "@/lib/format";
import { changeLabel, titleFor, type Catalogue, type GenerateInput } from "@/lib/generation-input";
import { db } from "../db";
import { tracks, type Track } from "../db/schema";
import { getTrackById } from "../tracks";
import { pickAudio } from "./pick-audio";

export const RATE_LIMIT = { max: 20, windowMinutes: 10 };
/** All anonymous makes across the app (clearing cookies resets the per-person limit). */
export const ANON_RATE_LIMIT = { max: 30, windowMinutes: 10 };

/** Who's making: a signed-in user, or an anonymous browser (mozart_anon). */
export type Maker = { userId: string } | { anonId: string };

// URL-safe, 10 characters.
const slug = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);

export type CreateResult =
  | { ok: true; track: Track }
  | { ok: false; status: 404 | 429; error: string };

/** The root original song of what's being changed (never a "×" title). */
async function resolveSource(input: GenerateInput, catalogue: Catalogue) {
  if ("sourceSongId" in input && input.sourceSongId) {
    const song = findSong(catalogue.songs, input.sourceSongId)!;
    return { found: true as const, root: { song: song.title, artist: song.artist }, track: null };
  }
  if ("sourceTrackId" in input && input.sourceTrackId) {
    const track = await getTrackById(input.sourceTrackId);
    if (!track) return { found: false as const };
    const gi = track.generationInput;
    const song = gi.rootSong ?? gi.sourceSong ?? rootTitle(track.title);
    const artist = gi.rootArtist ?? gi.sourceArtist ?? "";
    return { found: true as const, root: { song, artist }, track };
  }
  return { found: true as const, root: null, track: null };
}

/**
 * Validated input → a new track (POST /api/generate): owned by the user, or
 * unowned with the browser's anonymous id until it's claimed at sign-in.
 */
export async function createGeneratedTrack(maker: Maker, input: GenerateInput, catalogue: Catalogue): Promise<CreateResult> {
  const anon = "anonId" in maker;
  const limit = anon ? ANON_RATE_LIMIT : RATE_LIMIT;
  const since = new Date(Date.now() - limit.windowMinutes * 60_000);
  const [{ recent }] = await db
    .select({ recent: count() })
    .from(tracks)
    .where(and(anon ? isNull(tracks.ownerUserId) : eq(tracks.ownerUserId, maker.userId), gt(tracks.createdAt, since)));
  if (recent >= limit.max) {
    return { ok: false, status: 429, error: "That's a lot of songs. Try again in a few minutes." };
  }

  const source = await resolveSource(input, catalogue);
  if (!source.found) return { ok: false, status: 404, error: "That track doesn't exist." };

  const audio = pickAudio(input, source.track?.audioUrl);
  const label = changeLabel(input, catalogue);
  const generationInput: Record<string, string> = {
    ...Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)),
    ...(source.root ? { rootSong: source.root.song, rootArtist: source.root.artist } : {}),
    audioId: audio.id,
    label,
  };

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const [track] = await db
        .insert(tracks)
        .values({
          publicSlug: slug(),
          mode: input.mode,
          title: titleFor(input, source.root?.song ?? null, catalogue),
          audioUrl: audio.file,
          sourceTrackId: source.track?.id ?? null,
          generationInput,
          ownerUserId: anon ? null : maker.userId,
          anonymousSessionId: anon ? maker.anonId : null,
        })
        .returning();
      return { ok: true, track };
    } catch (err) {
      if (!isSlugCollision(err)) throw err;
    }
  }
  throw new Error("Could not allocate a unique slug");
}

function isSlugCollision(err: unknown): boolean {
  const cause = (err as { cause?: { code?: string; constraint_name?: string } })?.cause ?? (err as { code?: string; constraint_name?: string });
  return cause?.code === "23505" && (cause.constraint_name ?? "").includes("public_slug");
}
