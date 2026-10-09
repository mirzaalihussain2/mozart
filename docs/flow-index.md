# Mozart prototype · Main flow · screen index

Source of truth for UI and experience. 39 screens, 390 × 844 pt (iPhone-size), rendered at 3× (1170 × 2532 px).
Each screen: ID (row-column), title, image file, source file, then every tappable element and where it goes.

Accent: off-white #f2f2f2 (play, saved ✓, primary buttons). Modes: Remix #ff754c orange · Cover #a259ff purple · Rewrite #2ec4b6 teal · Vibe / Something new #ffc93c yellow.
Greys: background #121212, surface #202020, raised #2e2e2e, borders #474747. Text #d9d9d9, secondary #bababa. Font: DM Sans.

## Row 01 · 1 · Creator: sign in, pick what to make

### 01-01 · Landing / Sign in
- Image: `1-main-flow/png/01-01_landing-sign-in.png` · Source: `1-main-flow/html-source/CfLanding.dc.html` · Rendered HTML: `1-main-flow/html-rendered/01-01_landing-sign-in.html`
- Tap “Connect Spotify to get started” → 01-02 · Create home (colour blocks)
- Tap “Log in” → 01-02 · Create home (colour blocks)

### 01-02 · Create home (colour blocks)
- Image: `1-main-flow/png/01-02_create-home-colour-blocks.png` · Source: `1-main-flow/html-source/CfHome.dc.html` · Rendered HTML: `1-main-flow/html-rendered/01-02_create-home-colour-blocks.html`
- Tap “Remix Same song, new genre.” → 02-01 · Remix 1 · Pick a song
- Tap “Cover Same song, new artist.” → 02-03 · Cover 1 · Pick a song
- Tap “Rewrite Same song, new lyrics.” → 02-05 · Rewrite 1 · Pick a song
- Tap “Something new Prompt a brand-new song.” → 02-07 · Something new · Describe it
- Tap “Create” → 01-02 · Create home (colour blocks)
- Tap “Library” → 07-01 · Library

### 01-03 · Create home · song playing (mini player)
- Image: `1-main-flow/png/01-03_create-home-song-playing-mini-player.png` · Source: `1-main-flow/html-source/CfHomePlaying.dc.html` · Rendered HTML: `1-main-flow/html-rendered/01-03_create-home-song-playing-mini-player.html`
- Tap “Remix Same song, new genre.” → 02-01 · Remix 1 · Pick a song
- Tap “Cover Same song, new artist.” → 02-03 · Cover 1 · Pick a song
- Tap “Rewrite Same song, new lyrics.” → 02-05 · Rewrite 1 · Pick a song
- Tap “Something new Prompt a brand-new song.” → 02-07 · Something new · Describe it
- Tap “Now playing: Cruel Summer × Bollywood by Ali. Open player” → 03-05 · Player · creator
- Tap “Create” → 01-03 · Create home · song playing (mini player)
- Tap “Library” → 07-02 · Library · song playing (mini player)

## Row 02 · 1a · Make something: Remix, Cover, Rewrite, Something new (header A: the tinted pill is the back button)

### 02-01 · Remix 1 · Pick a song
- Image: `1-main-flow/png/02-01_remix-1-pick-a-song.png` · Source: `1-main-flow/html-source/CfRemix1.dc.html` · Rendered HTML: `1-main-flow/html-rendered/02-01_remix-1-pick-a-song.html`
- Tap “Back” → 01-02 · Create home (colour blocks)
- Tap “Cruel Summer by Taylor Swift” → 02-02 · Remix 2 · …but make it
- Tap “Delilah (pull me out of this) by Fred again..” → 02-02 · Remix 2 · …but make it
- Tap “In Too Deep by Sum 41” → 02-02 · Remix 2 · …but make it
- Tap “Kesariya by Arijit Singh” → 02-02 · Remix 2 · …but make it
- Tap “Espresso by Sabrina Carpenter” → 02-02 · Remix 2 · …but make it
- Tap “Blinding Lights by The Weeknd” → 02-02 · Remix 2 · …but make it
- Tap “Payphone by Maroon 5” → 02-02 · Remix 2 · …but make it
- Tap “Not Like Us by Kendrick Lamar” → 02-02 · Remix 2 · …but make it
- Tap “Birds of a Feather by Billie Eilish” → 02-02 · Remix 2 · …but make it
- Tap “Jai Ho by A.R. Rahman” → 02-02 · Remix 2 · …but make it
- Tap “Levitating by Dua Lipa” → 02-02 · Remix 2 · …but make it
- Tap “Mr. Brightside by The Killers” → 02-02 · Remix 2 · …but make it
- Tap “APT. by ROSÉ & Bruno Mars” → 02-02 · Remix 2 · …but make it
- Tap “Good Luck, Babe! by Chappell Roan” → 02-02 · Remix 2 · …but make it
- Tap “Teenage Dirtbag by Wheatus” → 02-02 · Remix 2 · …but make it
- Tap “Dancing Queen by ABBA” → 02-02 · Remix 2 · …but make it

### 02-02 · Remix 2 · …but make it
- Image: `1-main-flow/png/02-02_remix-2-but-make-it.png` · Source: `1-main-flow/html-source/CfRemix2.dc.html` · Rendered HTML: `1-main-flow/html-rendered/02-02_remix-2-but-make-it.html`
- Tap “Back” → 02-01 · Remix 1 · Pick a song
- Tap “Cruel Summer by Taylor Swift, change song” → 02-01 · Remix 1 · Pick a song
- Tap “Generate remix” → 03-01 · Generating · Remix

### 02-03 · Cover 1 · Pick a song
- Image: `1-main-flow/png/02-03_cover-1-pick-a-song.png` · Source: `1-main-flow/html-source/CfCover1.dc.html` · Rendered HTML: `1-main-flow/html-rendered/02-03_cover-1-pick-a-song.html`
- Tap “Back” → 01-02 · Create home (colour blocks)
- Tap “Cruel Summer by Taylor Swift” → 02-04 · Cover 2 · …sung by
- Tap “Delilah (pull me out of this) by Fred again..” → 02-04 · Cover 2 · …sung by
- Tap “In Too Deep by Sum 41” → 02-04 · Cover 2 · …sung by
- Tap “Kesariya by Arijit Singh” → 02-04 · Cover 2 · …sung by
- Tap “Espresso by Sabrina Carpenter” → 02-04 · Cover 2 · …sung by
- Tap “Blinding Lights by The Weeknd” → 02-04 · Cover 2 · …sung by
- Tap “Payphone by Maroon 5” → 02-04 · Cover 2 · …sung by
- Tap “Not Like Us by Kendrick Lamar” → 02-04 · Cover 2 · …sung by
- Tap “Birds of a Feather by Billie Eilish” → 02-04 · Cover 2 · …sung by
- Tap “Jai Ho by A.R. Rahman” → 02-04 · Cover 2 · …sung by
- Tap “Levitating by Dua Lipa” → 02-04 · Cover 2 · …sung by
- Tap “Mr. Brightside by The Killers” → 02-04 · Cover 2 · …sung by
- Tap “APT. by ROSÉ & Bruno Mars” → 02-04 · Cover 2 · …sung by
- Tap “Good Luck, Babe! by Chappell Roan” → 02-04 · Cover 2 · …sung by
- Tap “Teenage Dirtbag by Wheatus” → 02-04 · Cover 2 · …sung by
- Tap “Dancing Queen by ABBA” → 02-04 · Cover 2 · …sung by

### 02-04 · Cover 2 · …sung by
- Image: `1-main-flow/png/02-04_cover-2-sung-by.png` · Source: `1-main-flow/html-source/CfCover2.dc.html` · Rendered HTML: `1-main-flow/html-rendered/02-04_cover-2-sung-by.html`
- Tap “Back” → 02-03 · Cover 1 · Pick a song
- Tap “In Too Deep by Sum 41, change song” → 02-03 · Cover 1 · Pick a song
- Tap “Generate cover” → 03-02 · Generating · Cover

### 02-05 · Rewrite 1 · Pick a song
- Image: `1-main-flow/png/02-05_rewrite-1-pick-a-song.png` · Source: `1-main-flow/html-source/CfRewrite1.dc.html` · Rendered HTML: `1-main-flow/html-rendered/02-05_rewrite-1-pick-a-song.html`
- Tap “Back” → 01-02 · Create home (colour blocks)
- Tap “Cruel Summer by Taylor Swift” → 02-06 · Rewrite 2 · …but it’s about
- Tap “Delilah (pull me out of this) by Fred again..” → 02-06 · Rewrite 2 · …but it’s about
- Tap “In Too Deep by Sum 41” → 02-06 · Rewrite 2 · …but it’s about
- Tap “Kesariya by Arijit Singh” → 02-06 · Rewrite 2 · …but it’s about
- Tap “Espresso by Sabrina Carpenter” → 02-06 · Rewrite 2 · …but it’s about
- Tap “Blinding Lights by The Weeknd” → 02-06 · Rewrite 2 · …but it’s about
- Tap “Payphone by Maroon 5” → 02-06 · Rewrite 2 · …but it’s about
- Tap “Not Like Us by Kendrick Lamar” → 02-06 · Rewrite 2 · …but it’s about
- Tap “Birds of a Feather by Billie Eilish” → 02-06 · Rewrite 2 · …but it’s about
- Tap “Jai Ho by A.R. Rahman” → 02-06 · Rewrite 2 · …but it’s about
- Tap “Levitating by Dua Lipa” → 02-06 · Rewrite 2 · …but it’s about
- Tap “Mr. Brightside by The Killers” → 02-06 · Rewrite 2 · …but it’s about
- Tap “APT. by ROSÉ & Bruno Mars” → 02-06 · Rewrite 2 · …but it’s about
- Tap “Good Luck, Babe! by Chappell Roan” → 02-06 · Rewrite 2 · …but it’s about
- Tap “Teenage Dirtbag by Wheatus” → 02-06 · Rewrite 2 · …but it’s about
- Tap “Dancing Queen by ABBA” → 02-06 · Rewrite 2 · …but it’s about

### 02-06 · Rewrite 2 · …but it’s about
- Image: `1-main-flow/png/02-06_rewrite-2-but-it-s-about.png` · Source: `1-main-flow/html-source/CfRewrite2.dc.html` · Rendered HTML: `1-main-flow/html-rendered/02-06_rewrite-2-but-it-s-about.html`
- Tap “Back” → 02-05 · Rewrite 1 · Pick a song
- Tap “Payphone by Maroon 5, change song” → 02-05 · Rewrite 1 · Pick a song
- Tap “Generate rewrite” → 03-03 · Generating · Rewrite

### 02-07 · Something new · Describe it
- Image: `1-main-flow/png/02-07_something-new-describe-it.png` · Source: `1-main-flow/html-source/CfVibe.dc.html` · Rendered HTML: `1-main-flow/html-rendered/02-07_something-new-describe-it.html`
- Tap “Back” → 01-02 · Create home (colour blocks)
- Tap “Generate song” → 03-04 · Generating · Vibe

### 02-08 · Something new · after tapping the box
- Image: `1-main-flow/png/02-08_something-new-after-tapping-the-box.png` · Source: `1-main-flow/html-source/CfVibeTap.dc.html` · Rendered HTML: `1-main-flow/html-rendered/02-08_something-new-after-tapping-the-box.html`
- Tap “Back” → 01-02 · Create home (colour blocks)
- Tap “Generate song” → 03-04 · Generating · Vibe

## Row 03 · 1b · Every path: generate (in that mode’s colour), auto-save, then the player

### 03-01 · Generating · Remix
- Image: `1-main-flow/png/03-01_generating-remix.png` · Source: `1-main-flow/html-source/CfGenRemix.dc.html` · Rendered HTML: `1-main-flow/html-rendered/03-01_generating-remix.html`
- Tap “Track ready, open player” → 03-05 · Player · creator

### 03-02 · Generating · Cover
- Image: `1-main-flow/png/03-02_generating-cover.png` · Source: `1-main-flow/html-source/CfGenCover.dc.html` · Rendered HTML: `1-main-flow/html-rendered/03-02_generating-cover.html`
- Tap “Track ready, open player” → 03-05 · Player · creator

### 03-03 · Generating · Rewrite
- Image: `1-main-flow/png/03-03_generating-rewrite.png` · Source: `1-main-flow/html-source/CfGenRewrite.dc.html` · Rendered HTML: `1-main-flow/html-rendered/03-03_generating-rewrite.html`
- Tap “Track ready, open player” → 03-05 · Player · creator

### 03-04 · Generating · Vibe
- Image: `1-main-flow/png/03-04_generating-vibe.png` · Source: `1-main-flow/html-source/CfGenVibe.dc.html` · Rendered HTML: `1-main-flow/html-rendered/03-04_generating-vibe.html`
- Tap “Track ready, open player” → 03-05 · Player · creator

### 03-05 · Player · creator
- Image: `1-main-flow/png/03-05_player-creator.png` · Source: `1-main-flow/html-source/CfPlayerSplit.dc.html` · Rendered HTML: `1-main-flow/html-rendered/03-05_player-creator.html`
- Tap “Minimise player” → 07-02 · Library · song playing (mini player)
- Tap “Share” → 03-06 · Share sheet
- Tap “Remix” → 04-01 · Remix · …but make it
- Tap “Cover” → 04-02 · Cover · …sung by
- Tap “Rewrite” → 04-03 · Rewrite · …but it’s about
- Tap “Vibe” → 04-04 · Vibe · describe the change

### 03-06 · Share sheet
- Image: `1-main-flow/png/03-06_share-sheet.png` · Source: `1-main-flow/html-source/CfShareOverSplit.dc.html` · Rendered HTML: `1-main-flow/html-rendered/03-06_share-sheet.html`
- Tap “Minimise player” → 07-02 · Library · song playing (mini player)
- Tap “Share” → 03-06 · Share sheet
- Tap “Remix” → 04-01 · Remix · …but make it
- Tap “Cover” → 04-02 · Cover · …sung by
- Tap “Rewrite” → 04-03 · Rewrite · …but it’s about
- Tap “Vibe” → 04-04 · Vibe · describe the change
- Tap “Close share sheet” → 03-05 · Player · creator
- Tap “Close” → 03-05 · Player · creator
- Tap “Open as recipient See what your friend will see” → 05-01 · Player · recipient, not signed in

## Row 04 · 1c · Player buttons go straight to step 2, track already picked (Remix, Cover, Rewrite, Vibe)

### 04-01 · Remix · …but make it
- Image: `1-main-flow/png/04-01_remix-but-make-it.png` · Source: `1-main-flow/html-source/CfCRemix.dc.html` · Rendered HTML: `1-main-flow/html-rendered/04-01_remix-but-make-it.html`
- Tap “Back” → 03-05 · Player · creator
- Tap “Cruel Summer × Bollywood Ali, back to the player” → 03-05 · Player · creator
- Tap “Generate remix” → 03-01 · Generating · Remix

### 04-02 · Cover · …sung by
- Image: `1-main-flow/png/04-02_cover-sung-by.png` · Source: `1-main-flow/html-source/CfCCover.dc.html` · Rendered HTML: `1-main-flow/html-rendered/04-02_cover-sung-by.html`
- Tap “Back” → 03-05 · Player · creator
- Tap “Cruel Summer × Bollywood Ali, back to the player” → 03-05 · Player · creator
- Tap “Generate cover” → 03-02 · Generating · Cover

### 04-03 · Rewrite · …but it’s about
- Image: `1-main-flow/png/04-03_rewrite-but-it-s-about.png` · Source: `1-main-flow/html-source/CfCRewrite.dc.html` · Rendered HTML: `1-main-flow/html-rendered/04-03_rewrite-but-it-s-about.html`
- Tap “Back” → 03-05 · Player · creator
- Tap “Cruel Summer × Bollywood Ali, back to the player” → 03-05 · Player · creator
- Tap “Generate rewrite” → 03-03 · Generating · Rewrite

### 04-04 · Vibe · describe the change
- Image: `1-main-flow/png/04-04_vibe-describe-the-change.png` · Source: `1-main-flow/html-source/CfCVibe.dc.html` · Rendered HTML: `1-main-flow/html-rendered/04-04_vibe-describe-the-change.html`
- Tap “Back” → 03-05 · Player · creator
- Tap “Cruel Summer × Bollywood, Ali, back to the player” → 03-05 · Player · creator
- Tap “Generate song” → 03-04 · Generating · Vibe

### 04-05 · Vibe · after tapping the box
- Image: `1-main-flow/png/04-05_vibe-after-tapping-the-box.png` · Source: `1-main-flow/html-source/CfCVibeTap.dc.html` · Rendered HTML: `1-main-flow/html-rendered/04-05_vibe-after-tapping-the-box.html`
- Tap “Back” → 03-05 · Player · creator
- Tap “Cruel Summer × Bollywood, Ali, back to the player” → 03-05 · Player · creator
- Tap “Generate song” → 03-04 · Generating · Vibe

## Row 05 · 2 · Recipient: listen on the same player, then make it yours

### 05-01 · Player · recipient, not signed in
- Image: `1-main-flow/png/05-01_player-recipient-not-signed-in.png` · Source: `1-main-flow/html-source/CfPlayerTilesR.dc.html` · Rendered HTML: `1-main-flow/html-rendered/05-01_player-recipient-not-signed-in.html`
- Tap “Mozart” → 01-01 · Landing / Sign in
- Tap “Save to your library (sign up)” → 06-06 · Send to Ali · sign in with Spotify
- Tap “Remix” → 05-02 · Remix · …but make it
- Tap “Cover” → 05-03 · Cover · …sung by
- Tap “Rewrite” → 05-04 · Rewrite · …but it’s about
- Tap “Vibe” → 05-05 · Vibe · describe the change

### 05-02 · Remix · …but make it
- Image: `1-main-flow/png/05-02_remix-but-make-it.png` · Source: `1-main-flow/html-source/CfRRemix.dc.html` · Rendered HTML: `1-main-flow/html-rendered/05-02_remix-but-make-it.html`
- Tap “Back” → 05-01 · Player · recipient, not signed in
- Tap “Cruel Summer × Bollywood Ali, back to the player” → 05-01 · Player · recipient, not signed in
- Tap “Generate remix” → 06-01 · Generating · Remix

### 05-03 · Cover · …sung by
- Image: `1-main-flow/png/05-03_cover-sung-by.png` · Source: `1-main-flow/html-source/CfRCover.dc.html` · Rendered HTML: `1-main-flow/html-rendered/05-03_cover-sung-by.html`
- Tap “Back” → 05-01 · Player · recipient, not signed in
- Tap “Cruel Summer × Bollywood Ali, back to the player” → 05-01 · Player · recipient, not signed in
- Tap “Generate cover” → 06-02 · Generating · Cover

### 05-04 · Rewrite · …but it’s about
- Image: `1-main-flow/png/05-04_rewrite-but-it-s-about.png` · Source: `1-main-flow/html-source/CfRRewrite.dc.html` · Rendered HTML: `1-main-flow/html-rendered/05-04_rewrite-but-it-s-about.html`
- Tap “Back” → 05-01 · Player · recipient, not signed in
- Tap “Cruel Summer × Bollywood Ali, back to the player” → 05-01 · Player · recipient, not signed in
- Tap “Generate rewrite” → 06-03 · Generating · Rewrite

### 05-05 · Vibe · describe the change
- Image: `1-main-flow/png/05-05_vibe-describe-the-change.png` · Source: `1-main-flow/html-source/CfRVibe.dc.html` · Rendered HTML: `1-main-flow/html-rendered/05-05_vibe-describe-the-change.html`
- Tap “Back” → 05-01 · Player · recipient, not signed in
- Tap “Cruel Summer × Bollywood, Ali, back to the player” → 05-01 · Player · recipient, not signed in
- Tap “Generate song” → 06-04 · Generating · Vibe

### 05-06 · Vibe · after tapping the box
- Image: `1-main-flow/png/05-06_vibe-after-tapping-the-box.png` · Source: `1-main-flow/html-source/CfRVibeTap.dc.html` · Rendered HTML: `1-main-flow/html-rendered/05-06_vibe-after-tapping-the-box.html`
- Tap “Back” → 05-01 · Player · recipient, not signed in
- Tap “Cruel Summer × Bollywood, Ali, back to the player” → 05-01 · Player · recipient, not signed in
- Tap “Generate song” → 06-04 · Generating · Vibe

### 05-07 · Share sheet · recipient
- Image: `1-main-flow/png/05-07_share-sheet-recipient.png` · Source: `1-main-flow/html-source/CfShareROver.dc.html` · Rendered HTML: `1-main-flow/html-rendered/05-07_share-sheet-recipient.html`
- Tap “Mozart” → 01-01 · Landing / Sign in
- Tap “Save to your library (sign up)” → 06-06 · Send to Ali · sign in with Spotify
- Tap “Remix” → 05-02 · Remix · …but make it
- Tap “Cover” → 05-03 · Cover · …sung by
- Tap “Rewrite” → 05-04 · Rewrite · …but it’s about
- Tap “Vibe” → 05-05 · Vibe · describe the change
- Tap “Close share sheet” → 05-01 · Player · recipient, not signed in
- Tap “Close” → 05-01 · Player · recipient, not signed in

## Row 06 · 2a · Recipient: generate, sign in to send to Ali, then they’re a creator · generating in the chosen mode’s colour

### 06-01 · Generating · Remix
- Image: `1-main-flow/png/06-01_generating-remix.png` · Source: `1-main-flow/html-source/CfGenRRemix.dc.html` · Rendered HTML: `1-main-flow/html-rendered/06-01_generating-remix.html`
- Tap “Track ready, open player” → 06-05 · Player · recipient’s remix, not signed in

### 06-02 · Generating · Cover
- Image: `1-main-flow/png/06-02_generating-cover.png` · Source: `1-main-flow/html-source/CfGenRCover.dc.html` · Rendered HTML: `1-main-flow/html-rendered/06-02_generating-cover.html`
- Tap “Track ready, open player” → 06-05 · Player · recipient’s remix, not signed in

### 06-03 · Generating · Rewrite
- Image: `1-main-flow/png/06-03_generating-rewrite.png` · Source: `1-main-flow/html-source/CfGenRRewrite.dc.html` · Rendered HTML: `1-main-flow/html-rendered/06-03_generating-rewrite.html`
- Tap “Track ready, open player” → 06-05 · Player · recipient’s remix, not signed in

### 06-04 · Generating · Vibe
- Image: `1-main-flow/png/06-04_generating-vibe.png` · Source: `1-main-flow/html-source/CfGenRVibe.dc.html` · Rendered HTML: `1-main-flow/html-rendered/06-04_generating-vibe.html`
- Tap “Track ready, open player” → 06-05 · Player · recipient’s remix, not signed in

### 06-05 · Player · recipient’s remix, not signed in
- Image: `1-main-flow/png/06-05_player-recipient-s-remix-not-signed-in.png` · Source: `1-main-flow/html-source/CfPlayerTilesResult.dc.html` · Rendered HTML: `1-main-flow/html-rendered/06-05_player-recipient-s-remix-not-signed-in.html`
- Tap “Mozart” → 01-01 · Landing / Sign in
- Tap “Send to Ali” → 06-06 · Send to Ali · sign in with Spotify
- Tap “Save to your library (sign up)” → 06-06 · Send to Ali · sign in with Spotify
- Tap “Remix” → 05-02 · Remix · …but make it
- Tap “Cover” → 05-03 · Cover · …sung by
- Tap “Rewrite” → 05-04 · Rewrite · …but it’s about
- Tap “Vibe” → 05-05 · Vibe · describe the change

### 06-06 · Send to Ali · sign in with Spotify
- Image: `1-main-flow/png/06-06_send-to-ali-sign-in-with-spotify.png` · Source: `1-main-flow/html-source/CfSignup.dc.html` · Rendered HTML: `1-main-flow/html-rendered/06-06_send-to-ali-sign-in-with-spotify.html`
- Tap “Mozart” → 01-01 · Landing / Sign in
- Tap “Send to Ali” → 06-06 · Send to Ali · sign in with Spotify
- Tap “Save to your library (sign up)” → 06-06 · Send to Ali · sign in with Spotify
- Tap “Remix” → 05-02 · Remix · …but make it
- Tap “Cover” → 05-03 · Cover · …sung by
- Tap “Rewrite” → 05-04 · Rewrite · …but it’s about
- Tap “Vibe” → 05-05 · Vibe · describe the change
- Tap “Close” → 06-05 · Player · recipient’s remix, not signed in
- Tap “Continue with Spotify” → 06-07 · Back from Spotify · saved, share sheet already open

### 06-07 · Back from Spotify · saved, share sheet already open
- Image: `1-main-flow/png/06-07_back-from-spotify-saved-share-sheet-already-open.png` · Source: `1-main-flow/html-source/CfShareSignedIn.dc.html` · Rendered HTML: `1-main-flow/html-rendered/06-07_back-from-spotify-saved-share-sheet-already-open.html`
- Tap “Close player” → 07-01 · Library
- Tap “Share” → 06-07 · Back from Spotify · saved, share sheet already open
- Tap “Remix” → 04-01 · Remix · …but make it
- Tap “Cover” → 04-02 · Cover · …sung by
- Tap “Rewrite” → 04-03 · Rewrite · …but it’s about
- Tap “Vibe” → 04-04 · Vibe · describe the change
- Tap “Close share sheet” → 06-08 · Signed in · their remix on the creator player
- Tap “Close” → 06-08 · Signed in · their remix on the creator player
- Tap “Open as recipient See what your friend will see” → 05-01 · Player · recipient, not signed in

### 06-08 · Signed in · their remix on the creator player
- Image: `1-main-flow/png/06-08_signed-in-their-remix-on-the-creator-player.png` · Source: `1-main-flow/html-source/CfPlayerSignedIn.dc.html` · Rendered HTML: `1-main-flow/html-rendered/06-08_signed-in-their-remix-on-the-creator-player.html`
- Tap “Close player” → 07-01 · Library
- Tap “Share” → 06-07 · Back from Spotify · saved, share sheet already open
- Tap “Remix” → 04-01 · Remix · …but make it
- Tap “Cover” → 04-02 · Cover · …sung by
- Tap “Rewrite” → 04-03 · Rewrite · …but it’s about
- Tap “Vibe” → 04-04 · Vibe · describe the change

## Row 07 · 3 · Library

### 07-01 · Library
- Image: `1-main-flow/png/07-01_library.png` · Source: `1-main-flow/html-source/CfLibrary.dc.html` · Rendered HTML: `1-main-flow/html-rendered/07-01_library.html`
- Tap “Cruel Summer × Bollywood Today” → 03-05 · Player · creator
- Tap “Cruel Summer × Electronic REMIX Today” → 03-05 · Player · creator
- Tap “In Too Deep × Bollywood Yesterday” → 03-05 · Player · creator
- Tap “Euphoric electronic pop 3 Oct” → 03-05 · Player · creator
- Tap “Cinematic pop 1 Oct” → 03-05 · Player · creator
- Tap “In Too Deep × Lo-fi REMIX 28 Sep” → 03-05 · Player · creator
- Tap “Create” → 01-02 · Create home (colour blocks)
- Tap “Library” → 07-01 · Library

### 07-02 · Library · song playing (mini player)
- Image: `1-main-flow/png/07-02_library-song-playing-mini-player.png` · Source: `1-main-flow/html-source/CfLibraryPlaying.dc.html` · Rendered HTML: `1-main-flow/html-rendered/07-02_library-song-playing-mini-player.html`
- Tap “Cruel Summer × Bollywood Today” → 03-05 · Player · creator
- Tap “Cruel Summer × Electronic REMIX Today” → 03-05 · Player · creator
- Tap “In Too Deep × Bollywood Yesterday” → 03-05 · Player · creator
- Tap “Euphoric electronic pop 3 Oct” → 03-05 · Player · creator
- Tap “Cinematic pop 1 Oct” → 03-05 · Player · creator
- Tap “In Too Deep × Lo-fi REMIX 28 Sep” → 03-05 · Player · creator
- Tap “Now playing: Cruel Summer × Bollywood by Ali. Open player” → 03-05 · Player · creator
- Tap “Create” → 01-03 · Create home · song playing (mini player)
- Tap “Library” → 07-02 · Library · song playing (mini player)
