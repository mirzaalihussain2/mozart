// Spotify Web API responses: only the fields Mozart reads (checked against
// docs/fixtures/spotify/). Development Mode returns no genres or popularity.

export type SpotifyImage = { url: string; width: number | null; height: number | null };

export type SpotifyProfile = {
  id: string;
  display_name: string | null;
  images?: SpotifyImage[] | null;
};

export type SpotifyArtistRef = { id: string; name: string };

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: SpotifyArtistRef[];
  album: { images?: SpotifyImage[] | null };
};

export type SpotifyArtist = {
  id: string;
  name: string;
  images?: SpotifyImage[] | null;
};

export type SpotifyPage<T> = { items: T[] };

export type SpotifyTokenResponse = { access_token: string; token_type?: string; expires_in?: number };
