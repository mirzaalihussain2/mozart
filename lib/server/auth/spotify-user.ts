import "server-only";
import type { mapProfile } from "../../spotify/map-taste";
import type { SpotifyTaste } from "../../types/taste";
import { db } from "../db";
import { users } from "../db/schema";

/** Creates or refreshes a Spotify user by spotify_user_id (taste refreshed every sign-in). Returns the user id. */
export async function upsertSpotifyUser(profile: ReturnType<typeof mapProfile>, taste: SpotifyTaste): Promise<string> {
  const fields = {
    displayName: profile.displayName,
    firstName: profile.firstName,
    avatarUrl: profile.avatarUrl,
    authProvider: "spotify" as const,
    spotifyTaste: taste,
  };
  const [row] = await db
    .insert(users)
    .values({ spotifyUserId: profile.spotifyUserId, ...fields })
    .onConflictDoUpdate({ target: users.spotifyUserId, set: fields })
    .returning({ id: users.id });
  return row.id;
}
