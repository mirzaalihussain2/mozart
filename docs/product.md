# Mozart prototype · Product requirements

Your clarifications make the product tighter. The biggest improvement is that the viral loop is now more explicit:

> **Recipient gets value before signup, but must sign up to save/share the thing they just created.**

That is a much cleaner acquisition mechanic.

A few questions are still worth resolving, but none block us from moving forward:

1. **When exactly is signup required for the recipient?** My default would be: they can listen and generate one remix anonymously, but must sign up to save/share it. That gives them enough value before the gate.
2. **Does the original sender need an in-app “reply” relationship?** For the prototype, I’d say no. “Share back with Ali” can just mean generating a normal share link and opening WhatsApp/share UI addressed socially in the copy.
3. **Do we need a persistent library for the signed-in user in v1?** I think yes, but it can be extremely lightweight: just their generated tracks.
4. **Spotify taste storage:** I would initially store this against the user as JSON unless we need to query artists/genres independently. For a prototype, a separate normalized taste model is probably unnecessary.

With those assumptions, I’d rewrite the product requirements like this.

## 1. Prototype goal

Demonstrate that an AI music product becomes more compelling when:

- creation starts from the user's existing music taste
- sharing music is frictionless
- recipients can start creating almost instantly
- co-creation creates a natural reason for recipients to sign up

The core growth loop is:

**Spotify taste → personalised suggestions → generate + listen → share → recipient listens → recipient remixes → recipient signs up → shares back / continues creating**

The prototype should prove this loop, not the quality of the underlying music model.

## 2. Core user journeys

### Journey A — Create something new and personal

`Landing → Sign in with Spotify → Import taste → Personalised Create Home → Choose/create prompt → Generate → Listen → Share`

The key moment is:

> “These ideas feel relevant to my taste, and I want to try one.”

Requirements:
- Spotify authentication
- retrieve enough taste data to personalise suggestions
- show personalised generation ideas
- allow freeform text prompting
- mock generation
- create a playable track
- associate track with signed-in user

### Journey B — Share a track

`Track Player → Share → Copy link / WhatsApp → Recipient receives link`

Requirements:
- every track has a public URL
- recipient does not need an account
- link preview should clearly communicate that it is a song
- recipient can listen immediately
- Copy Link is required
- WhatsApp sharing is desirable if trivial to implement

### Journey C — Recipient listens and creates from it

`Open shared URL → Listen → Remix → Choose simple modification → Generate → Listen to new track`

Possible remix actions:
- Change genre
- Change vibe
- Change lyrics
- Surprise me

Important product principle:

> Remixing is not a separate content type. It is simply a faster way to create a new track using an existing track as context.

The target interaction is:

> **Go from received song to newly generated song in roughly two taps.**

Anonymous recipient can:
- listen
- create a remix
- listen to the remix

Anonymous recipient cannot:
- save the remix permanently
- share it
- associate it with an identity

For the prototype, I'd allow **one anonymous remix** before signup.

### Journey D — Recipient becomes a user

`Listen to remix → Attempt to share/save → Sign in with Spotify → Import taste → Track attached to account → Share back → Continue creating`

Primary signup message:

> **Sign in to share this with Ali**

Secondary benefit:

> Sign in with Spotify to save your track and get personalised ideas.

The signup should happen after the recipient has already created something, so the user has something valuable at risk of being lost.

## 3. Functional requirements

| Area | Requirement | Prototype |
|---|---|---|
| Authentication | Sign in with Spotify | **Real** |
| Spotify | Retrieve taste data | **Real** |
| Personalisation | Suggest creation ideas from taste | **Simple rules/templates** |
| Music creation | Text-prompt interface | **Real UI** |
| Music generation | Generate audio | **Mocked** |
| Audio | Playback | **Real** |
| Tracks | Persist signed-in user's tracks | **Real** |
| Library | Show user's tracks | **Minimal** |
| Sharing | Public track URL | **Real** |
| Copy link | Share track URL | **Real** |
| WhatsApp | Share shortcut | **If time permits** |
| Public listening | Listen without account | **Real** |
| Remixing | Genre/vibe/lyrics/surprise actions | **Real UI** |
| Remix generation | Return new track | **Mocked** |
| Anonymous creation | Recipient can make limited remix | **Real behaviour** |
| Signup gate | Required to save/share remix | **Real** |
| Contacts/social import | Friend invitations | **Out of scope / mocked** |

## 4. Screens and states

I agree that we should minimise distinct screens.

### 1. Landing
Contains:
- product proposition
- **Continue with Spotify**

### 2. Personalised Create Home
Contains:
- personalised prompt suggestions
- existing text-prompt creation UI
- perhaps lightweight access to Library
- generation loading state as an overlay/modal/spinner

No separate Spotify taste-confirmation screen.

### 3. Track Player
The main track-detail experience.

For a signed-in creator:
- artwork/title
- audio player
- Share
- Remix / Create from this
- perhaps Save/Library state

### 4. Public Track Player
I agree this should probably be **the same underlying screen/component**, rendered differently for an anonymous recipient.

Differences:
- no creator-only controls
- clear sender context
- strong **Remix this** CTA
- no signup required to listen

So conceptually it's a different user state, not necessarily a separate UI/page implementation.

### 5. Remix interaction
Likewise, this probably does **not** need to be a dedicated page.

Likely implementation:
- tap **Remix**
- bottom sheet/modal appears
- choose Genre / Vibe / Lyrics / Surprise me
- generation happens
- player updates to new track

We can decide the exact interaction during wireframing.

### 6. Signup gate
Likely a modal rather than a full page:

> **Share this with Ali**  
> Sign in with Spotify to save your track and send it back.

This appears when an anonymous recipient tries to share/save their generated remix.

## 5. Personalisation requirements

After Spotify login, retrieve enough information to understand the user's taste, probably:

- top artists
- top tracks
- genres inferred from artists

Use these to create several personalised starting points.

Example:

> **You like Fred again.. + Taylor Swift**  
> Create an emotional electronic-pop track with intimate vocals and a euphoric build.

For the prototype, these suggestions can be generated using simple templates rather than an LLM or recommendation system.

No separate “taste profile” screen is required.

## 6. Mock generation

Use a small set of pre-generated audio tracks, perhaps 5–10.

Each generation/remix request maps onto one of those assets.

Example categories:
- electronic
- pop
- indie/rock
- hip-hop
- Bollywood-inspired
- acoustic

The experience should still behave like generation:

`Prompt → brief loading state → new Track record → player`

Actual music-generation APIs are an optional stretch goal only.

## 7. Minimum data model

I agree with simplifying this.

### User

- `id`
- `spotify_user_id`
- `first_name`
- `avatar_url`
- `taste_data`
- `created_at`

For the prototype, I'd store `taste_data` as JSON, e.g.:

```text
{
  top_artists: [...],
  top_tracks: [...],
  genres: [...]
}
```

No separate taste tables unless the product later needs more sophisticated recommendation/querying.

### Track

- `id`
- `creator_user_id`
- `title`
- `prompt`
- `audio_url`
- `public_slug`
- `created_from_track_id` nullable
- `created_at`

Potentially also:

- `generation_type` — `"prompt"` / `"remix"`
- `remix_instruction` — e.g. `"change_genre: disco"`

But these are convenience metadata, not separate entities.

I agree: **no Share table and no Remix table are needed for this prototype.**

A remix is just another Track with:

`created_from_track_id = previous_track.id`

A share is just exposing that Track via its `public_slug`.

## 8. Explicitly out of scope

- real AI music generation
- native apps
- feeds
- follows
- likes/comments
- messaging
- contact syncing
- Instagram API integrations
- sophisticated social graph
- real-time collaboration
- advanced audio editing
- payments
- notifications
- sophisticated recommendation systems
- detailed Spotify taste-management UI

## 9. Prototype success criterion

Someone unfamiliar with the product should be able to experience this sequence:

**Sign in with Spotify → see ideas that feel personalised → create a song → share it → open it as a recipient → create a remix almost instantly → encounter a natural signup moment → sign up and share it back.**

If that flow feels polished and obvious, the prototype has done its job.

The next step should be the **screen-by-screen interaction spec**, because that will force us to decide exactly what appears on the player, what the recipient sees, where the remix controls live, and precisely where the signup gate occurs.
