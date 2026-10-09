import type { SpotifyTaste, TasteArtist, TasteTrack } from "../types/taste";

// Spotify taste for the dummy user (and the silent-fallback user), in exactly
// the shape mapped from real Spotify responses (lib/types/taste.ts).
// Songs: docs/designs/html/CfRemix1.dc.html, in design order.
// Artists: docs/designs/html/CfCover2.dc.html, in design order.
// Ids are mock placeholders; image URLs are null so the UI shows the grey
// initials placeholder the designs use.

function track(n: number, name: string, artists: string[]): TasteTrack {
  return {
    id: `mock-track-${String(n).padStart(2, "0")}`,
    name,
    artists,
    artist: artists.join(" & "),
    imageUrl: null,
  };
}

function artist(n: number, name: string): TasteArtist {
  return { id: `mock-artist-${String(n).padStart(2, "0")}`, name, imageUrl: null };
}

export const MOCK_TASTE: SpotifyTaste = {
  topTracks: [
    track(1, "Cruel Summer", ["Taylor Swift"]),
    track(2, "Delilah (pull me out of this)", ["Fred again.."]),
    track(3, "In Too Deep", ["Sum 41"]),
    track(4, "Kesariya", ["Arijit Singh"]),
    track(5, "Espresso", ["Sabrina Carpenter"]),
    track(6, "Blinding Lights", ["The Weeknd"]),
    track(7, "Payphone", ["Maroon 5"]),
    track(8, "Not Like Us", ["Kendrick Lamar"]),
    track(9, "Birds of a Feather", ["Billie Eilish"]),
    track(10, "Jai Ho", ["A.R. Rahman"]),
    track(11, "Levitating", ["Dua Lipa"]),
    track(12, "Mr. Brightside", ["The Killers"]),
    track(13, "APT.", ["ROSÉ", "Bruno Mars"]),
    track(14, "Good Luck, Babe!", ["Chappell Roan"]),
    track(15, "Teenage Dirtbag", ["Wheatus"]),
    track(16, "Dancing Queen", ["ABBA"]),
  ],
  topArtists: [
    artist(1, "Arijit Singh"),
    artist(2, "Taylor Swift"),
    artist(3, "Fred again.."),
    artist(4, "Billie Eilish"),
    artist(5, "The Weeknd"),
    artist(6, "Dua Lipa"),
    artist(7, "Kendrick Lamar"),
  ],
  genres: ["pop", "filmi", "electronic", "pop punk", "hip hop", "r&b"],
};
