// Shape of users.spotify_taste (docs/tech-spec.md §4). Mapped once at sign-in
// from Spotify's /me/top/artists and /me/top/tracks; the dummy user stores the
// same shape (lib/config/mock-taste.ts) so UI never knows the difference.

export type TasteArtist = {
  /** Spotify artist id. */
  id: string;
  name: string;
  /** artist.images[0].url; null renders the grey initials placeholder. */
  imageUrl: string | null;
};

export type TasteTrack = {
  /** Spotify track id. */
  id: string;
  name: string;
  /** track.artists[].name */
  artists: string[];
  /** Display string for the artists, e.g. "ROSÉ & Bruno Mars". */
  artist: string;
  /** track.album.images[0].url; null renders the grey initials placeholder. */
  imageUrl: string | null;
};

export type SpotifyTaste = {
  topArtists: TasteArtist[];
  topTracks: TasteTrack[];
  genres: string[];
};
