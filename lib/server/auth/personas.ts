import "server-only";
import { and, eq, notInArray } from "drizzle-orm";
import { FALLBACK_ORDER, STARTER_TRACKS, type Persona } from "../../config/personas";
import { STARTER_ARTWORK } from "../../config/starter-artwork";
import { findSinger, singersFrom } from "../../config/singers";
import { songsFrom } from "../../config/songs";
import { changeLabel, titleFor, type Catalogue, type GenerateInput } from "../../generation-input";
import { pickPersona, trackSlugFromPath } from "../../sign-in";
import { db } from "../db";
import { removeTrackArtwork } from "../artwork/storage";
import { tracks, users } from "../db/schema";
import { pickAudio } from "../generate/pick-audio";
import { getTrackBySlug } from "../tracks";

/**
 * Who a failed Spotify sign-in becomes: Candice, unless the track named in
 * `returnTo` is hers (for an anonymous track, the track it was made from),
 * then Derek. Server-side only; never trusts a name from the client.
 */
export async function pickFallbackPersona(returnTo: string): Promise<Persona> {
  const slug = trackSlugFromPath(returnTo);
  if (!slug) return FALLBACK_ORDER[0];
  const track = await getTrackBySlug(slug);
  let ownerId = track?.ownerUserId ?? null;
  if (track && !ownerId && track.sourceTrackId) {
    const [source] = await db.select({ owner: tracks.ownerUserId }).from(tracks).where(eq(tracks.id, track.sourceTrackId)).limit(1);
    ownerId = source?.owner ?? null;
  }
  return pickPersona(FALLBACK_ORDER, ownerId);
}

/** A starter track as a row, before ids are known (`sourceSlug` → `source_track_id`). */
export type StarterRow = {
  slug: string;
  mode: GenerateInput["mode"];
  title: string;
  audioUrl: string;
  generationInput: Record<string, string>;
  sourceSlug: string | null;
  createdAt: Date;
};

/**
 * A persona's starter library as rows, built by the same code as a real make
 * (titleFor, changeLabel, pickAudio) from their own taste. Sources come first.
 */
export function starterRows(persona: Persona, now: number): StarterRow[] {
  const catalogue: Catalogue = { songs: songsFrom(persona.spotifyTaste), singers: singersFrom(persona.spotifyTaste) };
  type Root = { song: string; artist: string; imageUrl: string | null };
  const built = new Map<string, { root: Root | null; audioUrl: string }>();
  return (STARTER_TRACKS[persona.id] ?? []).map((t) => {
    let input: GenerateInput;
    let root: Root | null = null;
    let sourceSlug: string | null = null;
    let sourceFile: string | undefined;
    if ("song" in t) {
      const song = catalogue.songs.find((s) => s.title === t.song);
      if (!song) throw new Error(`${persona.firstName}'s starter ${t.slug}: "${t.song}" isn't in their top tracks`);
      input = { ...t.change, sourceSongId: song.id } as GenerateInput;
      root = { song: song.title, artist: song.artist, imageUrl: song.imageUrl };
    } else if ("source" in t) {
      const source = built.get(t.source);
      if (!source) throw new Error(`${persona.firstName}'s starter ${t.slug}: source ${t.source} must come first`);
      // The source's slug stands in for its id (unknown until insert) so the audio pick is stable.
      input = { ...t.change, sourceTrackId: t.source } as GenerateInput;
      root = source.root;
      sourceSlug = t.source;
      sourceFile = source.audioUrl;
    } else {
      input = t.change;
    }
    const audio = pickAudio(input, sourceFile);
    built.set(t.slug, { root, audioUrl: audio.file });
    // Stored like a real make's input; the placeholder sourceTrackId is swapped for the real id at insert.
    const asked = Object.entries(input).filter(([k, v]) => v !== undefined && !(sourceSlug && k === "sourceTrackId"));
    const singerImageUrl = input.mode === "cover" ? findSinger(catalogue.singers, input.singerId)?.imageUrl : null;
    return {
      slug: t.slug,
      mode: input.mode,
      title: titleFor(input, root?.song ?? null, catalogue),
      audioUrl: audio.file,
      generationInput: {
        ...(Object.fromEntries(asked) as Record<string, string>),
        ...(root ? { rootSong: root.song, rootArtist: root.artist } : {}),
        ...(root?.imageUrl ? { rootImageUrl: root.imageUrl } : {}),
        ...(singerImageUrl ? { singerImageUrl } : {}),
        audioId: audio.id,
        label: changeLabel(input, catalogue),
      },
      sourceSlug,
      createdAt: new Date(now - t.ageMinutes * 60_000),
    };
  });
}

/**
 * e2e only: parallel tests all sign in as Derek, so a reset would delete
 * another test's fresh track. The e2e app sets this; never in production.
 */
const keepOtherTracks = () => process.env.E2E_KEEP_PERSONA_TRACKS === "1" && process.env.VERCEL_ENV !== "production";

/**
 * Upserts a persona and resets their library to the starter tracks, in one
 * transaction: their other tracks are deleted, and the starters are refreshed
 * in place by slug (same ids), so shared starter links and tracks made from
 * them keep working. Runs before claiming, so a fresh claim isn't wiped.
 */
export async function resetPersona(persona: Persona): Promise<string> {
  const rows = starterRows(persona, Date.now());
  const { id, ...fields } = persona;
  let removedArt: (string | null)[] = [];
  await db.transaction(async (tx) => {
    await tx.insert(users).values({ id, ...fields }).onConflictDoUpdate({ target: users.id, set: fields });
    const keep = rows.map((r) => r.slug);
    if (!keepOtherTracks()) {
      const removed = await tx
        .delete(tracks)
        .where(keep.length ? and(eq(tracks.ownerUserId, id), notInArray(tracks.publicSlug, keep)) : eq(tracks.ownerUserId, id))
        .returning({ artworkUrl: tracks.artworkUrl });
      removedArt = removed.map((r) => r.artworkUrl);
    }
    const ids = new Map<string, string>();
    for (const r of rows) {
      const sourceTrackId = r.sourceSlug ? ids.get(r.sourceSlug)! : null;
      const values = {
        publicSlug: r.slug,
        mode: r.mode,
        title: r.title,
        audioUrl: r.audioUrl,
        // Made once by pnpm artwork:starters, so it survives every reset.
        artworkUrl: STARTER_ARTWORK[r.slug] ?? null,
        sourceTrackId,
        generationInput: sourceTrackId ? { ...r.generationInput, sourceTrackId } : r.generationInput,
        ownerUserId: id,
        anonymousSessionId: null,
        createdAt: r.createdAt,
      };
      const [row] = await tx.insert(tracks).values(values).onConflictDoUpdate({ target: tracks.publicSlug, set: values }).returning({ id: tracks.id });
      ids.set(r.slug, row.id);
    }
  });
  // Their deleted tracks' art; starter art (starters/…) is never deleted.
  await removeTrackArtwork(removedArt);
  return id;
}
