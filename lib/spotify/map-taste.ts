// Spotify responses → users.spotify_taste (lib/types/taste.ts). Pure.

import type { SpotifyTaste, TasteArtist, TasteTrack } from "../types/taste";
import type { SpotifyArtist, SpotifyImage, SpotifyProfile, SpotifyTrack } from "./types";

export const MAX_TRACKS = 20;
export const MAX_ARTISTS = 12;

/** "Blackbird - Remastered 2009" → "Blackbird"; "lovely (with Khalid)" → "lovely"; 'Kesariya (From "Brahmastra")' → "Kesariya". */
export function cleanTrackName(name: string): string {
  return name
    .replace(/\s*[([](?:feat\.?|ft\.?|with|from)\s[^)\]]*[)\]]/gi, "")
    .replace(/\s+-\s+(?:.*\bremaster(?:ed)?\b.*|original version|.*\bremix|feat\.?\s.*|ft\.?\s.*|with\s.*)$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** The image closest to `target` px (by height, else width); null if none. */
export function imageNear(images: SpotifyImage[] | null | undefined, target = 300): string | null {
  if (!images?.length) return null;
  const size = (i: SpotifyImage) => i.height ?? i.width ?? 0;
  return [...images].sort((a, b) => Math.abs(size(a) - target) - Math.abs(size(b) - target))[0].url;
}

/** The largest image (for the avatar), or null. */
export function largestImage(images: SpotifyImage[] | null | undefined): string | null {
  if (!images?.length) return null;
  const size = (i: SpotifyImage) => i.height ?? i.width ?? 0;
  return [...images].sort((a, b) => size(b) - size(a))[0].url;
}

/** "ali" → "Ali"; "jane doe" → "Jane"; empty or null → "Friend". */
export function firstNameFrom(displayName: string | null | undefined): string {
  const word = displayName?.trim().split(/\s+/)[0] ?? "";
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : "Friend";
}

export function mapTracks(items: SpotifyTrack[], max = MAX_TRACKS): TasteTrack[] {
  const seen = new Set<string>();
  const out: TasteTrack[] = [];
  for (const t of items) {
    const name = cleanTrackName(t.name);
    const artists = t.artists.map((a) => a.name);
    if (!name || !artists.length) continue;
    const key = `${name.toLowerCase()}|${artists[0].toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: t.id, name, artists, artist: artists[0], imageUrl: imageNear(t.album.images) });
    if (out.length === max) break;
  }
  return out;
}

export function mapArtists(items: SpotifyArtist[]): TasteArtist[] {
  const seen = new Set<string>();
  const out: TasteArtist[] = [];
  for (const a of items) {
    if (seen.has(a.id) || seen.has(a.name.toLowerCase())) continue;
    seen.add(a.id);
    seen.add(a.name.toLowerCase());
    out.push({ id: a.id, name: a.name, imageUrl: imageNear(a.images) });
    if (out.length === MAX_ARTISTS) break;
  }
  return out;
}

/** Genres are always empty: Spotify returns none for this app (fixtures README). */
export function mapTaste(tracks: SpotifyTrack[], artists: SpotifyArtist[]): SpotifyTaste {
  return { topTracks: mapTracks(tracks), topArtists: mapArtists(artists), genres: [] };
}

export function mapProfile(profile: SpotifyProfile) {
  return {
    spotifyUserId: profile.id,
    displayName: profile.display_name?.trim() || firstNameFrom(profile.display_name),
    firstName: firstNameFrom(profile.display_name),
    avatarUrl: largestImage(profile.images),
  };
}
