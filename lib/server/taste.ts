import "server-only";
import { MOCK_TASTE } from "../config/mock-taste";
import { singersFrom } from "../config/singers";
import { songsFrom } from "../config/songs";
import type { Catalogue } from "../generation-input";
import type { SpotifyTaste } from "../types/taste";
import type { User } from "./db/schema";

const MIN_TRACKS = 6;

/**
 * Whose taste fills the pickers: a Spotify user's own (with ≥ 6 top tracks),
 * otherwise MOCK_TASTE (dummy Ali / Sam, signed-out visitors). If a Spotify
 * user has no top artists, the mock artists keep Cover usable.
 */
export function getTasteFor(user: Pick<User, "authProvider" | "spotifyTaste"> | null): SpotifyTaste {
  const taste = user?.authProvider === "spotify" ? user.spotifyTaste : null;
  if (!taste || (taste.topTracks?.length ?? 0) < MIN_TRACKS) return MOCK_TASTE;
  return taste.topArtists?.length ? taste : { ...taste, topArtists: MOCK_TASTE.topArtists };
}

/** Songs and singers the viewer may pick — and the API will accept. */
export function catalogueFor(user: Pick<User, "authProvider" | "spotifyTaste"> | null): Catalogue {
  const taste = getTasteFor(user);
  return { songs: songsFrom(taste), singers: singersFrom(taste) };
}
