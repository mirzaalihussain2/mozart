# Spotify Web API fixtures (real responses, trimmed)

Real responses from the project owner's account, used to test mapping and sign-in without calling Spotify.

- `me.json` — `GET /v1/me` (email replaced with ali@example.com; user id, profile links and avatar URLs replaced with placeholders)
- `top-tracks.json` — `GET /v1/me/top/tracks` (first 35 of 50 items; includes one duplicate on purpose)
- `top-artists.json` — `GET /v1/me/top/artists` (first 20 of 50 items)

Notes for mappers:
- Artist objects have **no `genres` and no `popularity`** fields for this app (Development Mode). Don't rely on them.
- Top tracks can contain duplicates by name + artist (different ids). De-duplicate.
- Track names can carry suffixes like " - Remastered 2009" or " (feat. X)"; artists can be several.
