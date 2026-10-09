# Mozart prototype · Technical specification

I’d keep the architecture very small. The designs imply a **single responsive web app**, one database, Spotify OAuth, static/mock audio generation, and one reusable track/player model powering both creator and recipient flows. The UI source of truth is the 39-screen flow you provided, including the four creation modes, player states, recipient flow, signup gate, mini-player and library.

# 1. Product architecture

```text
Mobile-first responsive web app
        |
        ├── Spotify OAuth
        |
        ├── App backend / API
        |     ├── Users
        |     ├── Spotify taste
        |     ├── Tracks
        |     └── Anonymous sessions
        |
        ├── Postgres database
        |
        └── Static audio assets
              └── mock generation results
```

I’d build it as one **Next.js app**, rather than separate frontend/backend projects.

Suggested stack:

- **Next.js + TypeScript**
- **Tailwind**
- **Postgres / Supabase**
- **Spotify OAuth**
- audio files stored in `/public/audio` for the prototype
- deploy to **Vercel**

That is enough.

---

# 2. Core routes

You do not need one URL per wireframe.

The 39 designs are mostly **states of a small number of routes**.

```text
/
Landing / sign in

/create
Create home

/create/remix
/create/cover
/create/rewrite
/create/vibe
Creation flows

/track/[slug]
Universal player

/library
Library

/auth/spotify/callback
OAuth callback
```

The track route is particularly important.

`/track/[slug]` should render differently depending on:

```text
logged in?
owns track?
anonymous recipient?
anonymous creator of derived track?
```

That covers creator and recipient player states without duplicating pages. The designs explicitly use the same creative actions from the player—Remix, Cover, Rewrite and Vibe—for both creators and recipients.

---

# 3. Authentication

## New user

Landing:

```text
Connect Spotify to get started
→ Spotify OAuth
→ callback
→ create user
→ fetch taste
→ /create
```

The prototype also needs:

```text
Log in
→ sign in as predefined dummy user
→ /create
```

Both routes currently enter the Create home in the designs.

### Spotify scopes

Minimum:

```text
user-read-private
user-top-read
```

Potentially:

```text
user-read-email
```

if useful for identity.

After authentication fetch:

- Spotify user ID
- display name
- top artists
- top tracks

For the prototype, fetch once at signup and cache the results.

---

# 4. Data model

You can do this with **two important tables**.

## `users`

```ts
User {
  id: uuid
  spotify_user_id: string | null
  display_name: string
  avatar_url: string | null

  spotify_taste: jsonb

  created_at: timestamp
}
```

Example `spotify_taste`:

```json
{
  "topArtists": [
    {
      "id": "...",
      "name": "Taylor Swift",
      "imageUrl": "..."
    }
  ],
  "topTracks": [
    {
      "id": "...",
      "name": "Cruel Summer",
      "artist": "Taylor Swift",
      "imageUrl": "..."
    }
  ],
  "genres": ["pop", "electronic"]
}
```

No need for separate Artist / Genre / SpotifyTrack tables.

For a five-hour-ish prototype, JSON is much simpler.

---

## `tracks`

```ts
Track {
  id: uuid

  owner_user_id: uuid | null

  title: string
  audio_url: string
  artwork_url: string | null

  public_slug: string

  mode: "remix" | "cover" | "rewrite" | "vibe"

  source_track_id: uuid | null

  generation_input: jsonb

  anonymous_session_id: string | null

  created_at: timestamp
}
```

Examples of `generation_input`:

### Remix

```json
{
  "sourceSong": "Cruel Summer",
  "sourceArtist": "Taylor Swift",
  "genre": "Bollywood"
}
```

### Cover

```json
{
  "sourceSong": "In Too Deep",
  "sourceArtist": "Sum 41",
  "coverArtist": "Arijit Singh"
}
```

### Rewrite

```json
{
  "sourceSong": "Payphone",
  "sourceArtist": "Maroon 5",
  "topic": "moving to London"
}
```

### Vibe

```json
{
  "prompt": "A euphoric Fred again..-style anthem about a summer that ended too soon"
}
```

This matches the four creation paths represented throughout the designs.

You do **not** need:

- `shares`
- `remixes`
- `covers`
- `rewrites`
- `library_items`

tables.

They are all Tracks.

---

# 5. Track relationships

The most important field is:

```text
source_track_id
```

Suppose Ali creates:

```text
Track A
Cruel Summer × Bollywood
```

A recipient then presses Remix and generates:

```text
Track B
Cruel Summer × Electronic
source_track_id = Track A
```

Then Cover:

```text
Track C
source_track_id = Track B
```

You naturally get a generation tree without introducing another model.

---

# 6. Mock music generation

Do **not** integrate a music API initially.

Put perhaps 8–12 prepared tracks in:

```text
/public/audio/
```

For example:

```text
remix-electronic.mp3
remix-bollywood.mp3
cover-female.mp3
cover-male.mp3
rewrite.mp3
vibe-electronic.mp3
vibe-acoustic.mp3
```

Then expose one endpoint:

```text
POST /api/generate
```

Input:

```json
{
  "mode": "remix",
  "sourceTrackId": "...",
  "parameters": {
    "genre": "Electronic"
  }
}
```

Backend:

```text
1. choose corresponding mock audio
2. create Track row
3. return new track
```

Then UI displays the appropriate colour generation screen before opening the player. The designs explicitly show separate generation states for Remix, Cover, Rewrite and Vibe which all converge on the player.

Later you can replace this function internally with:

```text
ElevenLabs / Lyria / MiniMax
```

without changing the UI or API contract.

That is exactly how I would architect the prototype.

---

# 7. Creation flows

## From Create home

The Create screen presents:

```text
Remix
Cover
Rewrite
Something new
```

as the four entry points.

### Remix

```text
pick Spotify song
→ pick genre/style
→ generate
```

### Cover

```text
pick Spotify song
→ pick Spotify artist
→ generate
```

### Rewrite

```text
pick Spotify song
→ pick suggested subject
→ generate
```

### Something new / Vibe

```text
enter prompt
→ generate
```

---

# 8. Creation from an existing track

This is where the architecture gets especially clean.

When entering from `/create`:

```text
sourceTrackId = null
```

User must choose a song first.

When entering from the Player:

```text
sourceTrackId = currentTrack.id
```

Therefore skip step 1 entirely.

The designs explicitly do this: player buttons go directly to the second step because the current track is already known.

So the components can literally be reused:

```tsx
<RemixFlow sourceTrack={track} />
```

versus:

```tsx
<RemixFlow sourceTrack={null} />
```

Same product mechanic, same implementation.

---

# 9. Anonymous recipient state

This is the only slightly unusual piece.

Someone receives:

```text
https://mozart.ai/track/abc123
```

No account required.

They can:

- listen
- Remix
- Cover
- Rewrite
- Vibe

They can then generate a new track while anonymous. That behaviour is explicitly part of the recipient flow.

### Implementation

Create an anonymous session cookie:

```text
mozart_anonymous_session = random UUID
```

When they generate:

```text
owner_user_id = null
anonymous_session_id = cookie value
```

That new Track is therefore persisted, but isn't owned by a user yet.

This is much safer than keeping it only in React state because it must survive the Spotify OAuth redirect.

---

# 10. Recipient signup / claiming a track

This is the most important technical flow.

Recipient creates Track B:

```text
owner_user_id = null
anonymous_session_id = XYZ
```

They press:

> Send to Ali

The design then asks them to continue with Spotify.

After OAuth:

```text
1. create User
2. find tracks with anonymous_session_id = XYZ
3. set owner_user_id = newUser.id
4. clear anonymous_session_id
5. redirect back to Track B
6. automatically open Share sheet
```

That produces the exact designed sequence:

```text
anonymous generation
→ signup
→ saved
→ share sheet already open
```

which is explicitly specified in the flow.

This is probably the only flow I would make sure is genuinely working end-to-end.

---

# 11. Sharing

Every Track receives:

```text
public_slug
```

Example:

```text
/track/c7Fk29
```

No special Share model required.

The share sheet needs:

```text
Copy link
WhatsApp
Open as recipient   // prototype/demo convenience
```

For WhatsApp:

```text
https://wa.me/?text=<encoded public URL>
```

Or use the Web Share API on supported mobile browsers.

The creator share sheet also includes the explicit demo path into the recipient experience.

---

# 12. Social link previews

The shared URL should render Open Graph metadata server-side:

```html
<meta property="og:title"
      content="Cruel Summer × Bollywood">

<meta property="og:description"
      content="Ali made this with Mozart">

<meta property="og:image"
      content="https://.../track-image.png">
```

This is what allows WhatsApp/iMessage/etc. to show the track as music rather than a bare URL.

For the prototype, use one static Mozart share-image template.

No dynamic image generation is necessary.

---

# 13. Player architecture

Create **one player component**.

```tsx
<Player track={track} viewerState={...} />
```

Viewer states:

```ts
type ViewerState =
  | "owner"
  | "recipient"
  | "anonymous-derived-owner"
```

Then vary controls.

### Owner

```text
Share
Remix
Cover
Rewrite
Vibe
```

### Recipient

```text
Save to library → signup
Remix
Cover
Rewrite
Vibe
```

### Anonymous derived-track creator

```text
Send to Ali → signup
Save → signup
Remix
Cover
Rewrite
Vibe
```

The designs show these as variants of essentially the same player rather than separate products.

---

# 14. Global audio state

Audio playback should sit above individual pages.

Something like:

```tsx
<AudioProvider>
    <App />
    <MiniPlayer />
</AudioProvider>
```

Store:

```ts
currentTrack
isPlaying
currentTime
```

When the full player is minimised:

```text
→ Library/Create
→ audio continues
→ MiniPlayer appears
```

The designs explicitly require persistent playback across Create and Library.

React Context is enough.

Do not introduce Redux/Zustand unless you already prefer one.

---

# 15. Library

Query:

```sql
SELECT *
FROM tracks
WHERE owner_user_id = current_user
ORDER BY created_at DESC;
```

That's it.

Tracks are effectively auto-saved after creation for signed-in users; the designs show all generation paths auto-saving before entering the player.

No:

- playlists
- favourites
- folders
- pagination
- search

needed.

---

# 16. Spotify-powered selection

The song-selection screens should read from:

```text
user.spotify_taste.topTracks
```

Artist-selection screens:

```text
user.spotify_taste.topArtists
```

For the dummy account, store exactly the same structure as fixture data:

```ts
const MOCK_TASTE = {...}
```

This is useful because every UI component can be ignorant of where the data came from.

It simply receives:

```tsx
<SongPicker tracks={tracks} />
<ArtistPicker artists={artists} />
```

Spotify user and dummy user behave identically after login.

---

# 17. Suggested component structure

```text
components/
  navigation/
    BottomNav.tsx

  audio/
    AudioProvider.tsx
    Player.tsx
    MiniPlayer.tsx

  creation/
    CreationModeHeader.tsx
    SongPicker.tsx
    ArtistPicker.tsx
    OptionChips.tsx
    PromptInput.tsx
    GenerateButton.tsx
    GeneratingScreen.tsx

  sharing/
    ShareSheet.tsx
    SignupSheet.tsx

  track/
    TrackArtwork.tsx
    TrackActions.tsx
```

Pages become mostly composition rather than bespoke logic.

---

# 18. Minimal API

You could realistically get away with about **five backend operations**:

```text
GET  /api/me
GET  /api/me/taste

POST /api/generate

GET  /api/tracks/:slug
GET  /api/library
```

Plus Spotify auth routes.

Most other behaviour is client-side navigation.

---

# 19. What should be real vs mocked

| Feature | Prototype |
|---|---|
| Responsive UI | Real |
| Spotify OAuth | Real |
| Top Spotify artists | Real |
| Top Spotify tracks | Real |
| Dummy login | Real |
| Database persistence | Real |
| Library | Real |
| Public URLs | Real |
| Anonymous recipient experience | Real |
| Anonymous → account claiming | Real |
| Copy/share links | Real |
| Audio playback | Real |
| AI generation | **Mock** |
| AI recommendations | **Mock** |
| Artist voice cloning | **Mock** |
| Actual remixing | **Mock** |

This keeps engineering focused on what the prototype is actually trying to demonstrate:

> **personalisation + frictionless creation + sharing + viral co-creation**

rather than music-model engineering.

---

# 20. Implementation order

If time is tight, I'd build in this order:

1. **Static UI + routing**
2. **Track model + mock audio playback**
3. **Generate flow using static audio**
4. **Public `/track/[slug]`**
5. **Recipient → generate → signup gate**
6. **Dummy login**
7. **Library**
8. **Spotify OAuth + taste data**
9. **WhatsApp/Open Graph polish**

The key end-to-end acceptance test should be:

```text
Creator logs in
→ chooses Remix
→ picks song
→ picks genre
→ generates
→ listens
→ shares URL

Recipient opens URL
→ listens
→ chooses transformation
→ generates
→ listens
→ presses Send to Ali
→ signs in
→ generated track survives OAuth
→ share sheet opens
```

If that one loop works beautifully, the prototype has succeeded.
