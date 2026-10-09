# Progress

## Milestone 5 — Recipient loop · done (PR #5, branch `m5-recipient-loop`)

The core loop works end to end:
1. Ali shares a track.
2. A friend with no account listens and makes **one** version anonymously, then sees it with **"Send to Ali"**.
3. They tap it, then "Continue with Spotify", and sign in (as Sam).
4. They land back on **their** track, now in **their** library, with the share sheet open and "Signed in · saved to your library".
5. Any further making while anonymous asks them to sign in.

### Player variant (decided on the server, `lib/server/viewer.ts`)

| Viewer | Track | Variant | Screen |
| --- | --- | --- | --- |
| Signed in, is owner | any | `creator` | 03-05 / 06-08 |
| Signed in, is owner, `?view=recipient` | any | `recipient`, with a stranger's prompts (preview) | 05-01 |
| Signed out, `mozart_anon` matches `anonymous_session_id` | anonymous | `recipientResult` | 06-05 |
| Signed out, anyone else | any | `recipient` | 05-01 |
| Signed in, not owner | any | `recipient`, no sign-up prompts, tiles make as themselves | 05-01 |

### Built
- **Anonymous identity** (`lib/server/anon.ts`, pure parts in `lib/anon-cookie.ts`):
  - `mozart_anon` = `crypto.randomUUID()`: httpOnly, Secure in production, Lax, path `/`, 1 year;
  - created **only** by `POST /api/generate` on a signed-out make;
  - anything that isn't a UUID is ignored;
  - helpers: `getAnonId`, `getOrCreateAnonId`, `clearAnonId`, `countAnonTracks`.
- **`POST /api/generate` when signed out:**
  - only from a track (otherwise 401 `signin_required`);
  - one make per cookie (unclaimed tracks ≥ 1 → 403 `{ error: "anon_limit", sendTo }`);
  - the track is inserted unowned with `anonymous_session_id`;
  - app-wide cap of 30 anonymous makes per 10 minutes (429);
  - the response adds `isAnonymous`.
- **Personas:** Sam joins Ali (fixed ids, upserted on sign-in and by the seed). `pickDummyPersona(returnTo)` returns the first persona who isn't the owner of the track in `returnTo`; for an anonymous track, that's its source's owner. No track → Ali.
- **`completeSignIn`** (`lib/server/auth/complete-sign-in.ts`), the one place sign-in finishes:
  - sets the session;
  - claims this browser's unowned tracks in one atomic UPDATE (`lib/server/auth/claim.ts`);
  - deletes `mozart_anon`;
  - redirects with `saved=1` **only if something was claimed**.

  `/auth/dummy` and `/auth/spotify/login` go through it. The M7 Spotify callback only needs to call it.
- **Send-to sheet** (06-06):
  - the title is "Send to {source owner's first name}", always from data;
  - its copy depends on the doorway: *send* (CfSignup: "save your {remix|cover|…} and send it back"), *more* (one make used), *save* (from someone else's track before making).
- **Where "Continue with Spotify" returns:**
  - after making → their own track `?share=1`, and the server adds `&saved=1` → 06-07;
  - before making → the track they're on, as Sam, with no toast.
- **Blocked makes:**
  - once the make is used, the player tiles and step-2 Generate open the sheet, never Generating;
  - `useGenerate` turns a stale-UI 401/403 into the same sheet.
- **Anonymous tracks** show "You" to the maker and "A friend" to everyone else, including in the title, `og:title` and the share image ("by a friend"). The cookie never leaves the server.

### Verified
- `pnpm typecheck`, `pnpm lint`, `pnpm build`: no errors.
- `pnpm test:unit`: **32/32**:
  - the UUID check and cookie attributes;
  - persona picking (Ali's track → Sam, Sam's → Ali, anonymous from Ali's → Sam, none → Ali);
  - `saved=1` only when something was claimed;
  - claiming only this browser's unowned tracks, once (database-backed, self-cleaning).
- `pnpm test:e2e`: **56/56**, twice in a row. New `recipient-loop.spec.ts`:
  - **the core loop with two browsers:** Ali makes and copies a link → the friend opens it paused → plays → remixes (the recipient Generating screen in orange for ≥ 3.5 s) → `recipientResult` with "Send to Ali", "You" and *Cruel Summer × Electronic* → httpOnly cookie, unowned database row → the second make opens the sheet (no Generating), and a forced POST gets 403 → Send to Ali → Continue → their track as `creator`, sheet + toast, `/api/me` = Sam → Library first, database row owned by Sam, cookie gone → Ali's library doesn't have it, and Ali sees "Sent by Sam" → a refresh shows no toast.
  - **edge cases:** reopening the result; another browser ("A friend", makes its own); a signed-in viewer of an anonymous track; signing in from 05-01 without a make (as Sam, no toast, no prompts); a replayed sign-in claims once; a tampered cookie claims nothing; 401 without a source; no cookie in the HTML or metadata; `/create` and `/library` still redirect.
- Gallery 05-01…05-07 and 06-01…06-08: the same diffs as M4. Real routes captured with cookies: 05-01 0.24%, 06-05 0.41%, 06-06 0.30%, 06-07 1.03%. Spot checks 03-05, 03-06 and 07-01: no drift.

### Decisions
- **Personas:** Ali is "Log in"; signing in from someone else's track gives Sam. The rule is "the first persona who isn't the owner of the `returnTo` track", resolved on the server, never from the client.
- **Claiming happens only in `completeSignIn`.** It's one atomic UPDATE, safe to replay.
- **"Saved" is decided by the server.** Sheets never put `saved=1` in `returnTo`.
- **Return targets:** the recipient's own result → `/track/{theirSlug}?share=1`; someone else's track → `/track/{slug}`. If they've already made one, every doorway returns to their own track.
- **Artist label:** "You" to the anonymous maker, "A friend" to everyone else. "Sent by a friend" on the recipient view of an anonymous track.
- **`?view=recipient`** shows the owner the stranger's prompts (+ button), so the preview matches what a friend sees.
- `completeSignIn({ userId, returnTo })` takes the validated `returnTo` rather than the request, since the cookies come from `next/headers`. `lib/server/auth.ts` became `lib/server/auth/` (index, http, personas, claim, complete-sign-in).

### Accepted gaps
- **Clearing cookies** loses access to the anonymous result, and resets the per-person one-make limit. The app-wide cap of 30 per 10 minutes is the only guard.
- **No cross-device claim:** only the browser that made the track can claim it.
- **No saving other people's tracks** (two tables only): signing in from 05-01 makes you Sam viewing Ali's track, not a copy in your library.
- **A brief Generating flash** can happen only when the page's knowledge of the limit is stale (e.g. a second tab); the 403 then opens the sheet.
- **"Continue with Spotify" is a GET that signs in and claims**, so a cross-site link could sign a visitor in as a dummy persona. That's acceptable for the dummy flow; real OAuth (M7) uses state/PKCE.
- **Your testing tracks:** four from M3/M4 testing remain in Ali's library.

### TODOs left for later milestones
- **M6:**
  - `components/audio/AudioProvider.tsx`: remove the pause-on-leave effect;
  - `components/audio/MiniPlayer.tsx`: drive it from `useAudio()`, and decide when it appears (01-03, 07-02).
- **M7:**
  - `app/auth/spotify/login/route.ts`: real Spotify OAuth;
  - the callback calls `completeSignIn`, with the dummy persona as the silent fallback.

## Next: Milestone 6 — Library + mini player

## Milestone 4 — Share · done (PR #4, merged)

A creator can share a track and a friend gets something worth tapping:
- **Copy link** copies the real URL and confirms it.
- **WhatsApp** opens with a ready-written message.
- **The link unfurls** with the title, who made it and a Mozart image.
- **Opening it** shows the recipient player, with no sign-in and no autoplay.
- **The app builds for Vercel** with only the Vercel environment variables.

### Built
- **One source for the app URL:**
  - `lib/app-url-core.ts` (pure, unit-tested) and `lib/server/app-url.ts`: `getAppUrl()` resolves APP_URL → `https://$VERCEL_URL` → the request origin → `http://127.0.0.1:3000`.
  - `trackUrl(slug)` builds share links; the track page's `shareUrl` uses it.
  - The root layout's `metadataBase` uses the env-only version, so the layout doesn't wait on a request.
  - `.env.example` and a new README document the Vercel variables.
- **Copy link** (03-06 / 05-07 / 06-07):
  - copies the clean `/track/{slug}` with the Clipboard API, falling back to a hidden textarea + `execCommand`;
  - shows the design's "Copied ✓" for 2 s (each tap restarts it) and announces "Link copied" in an `aria-live="polite"` region;
  - if both methods fail, shows the URL selected in a read-only field.
- **WhatsApp:** a real `https://wa.me/?text=…` link (new tab, `noopener noreferrer`). The message is in `lib/share-message.ts`: `“{title}” — I made this on Mozart. Listen and make your own version: {url}`. No other rows: the design has none.
- **Link previews** on `/track/[slug]`:
  - `generateMetadata` shares the page's per-request cached `getTrackBySlug` and never reads the session.
  - It sets: title `{title} · {owner} on Mozart`; description "Listen, then make your own version on Mozart."; canonical / `og:url` = `trackUrl`; `og:type` `music.song`; `site_name` Mozart; Twitter `summary_large_image`; `robots: noindex, nofollow`.
  - A missing slug gives a 404 with generic Mozart metadata.
- **OG image:** `app/track/[slug]/opengraph-image.tsx`, re-exported as `twitter-image`, built with `next/og`.
  - 1200 × 630, flat: `#121212`, a mode-colour block with the grey artwork square and the maker's initial, the title in DM Sans 700 (two lines, the second filled then "…"), "by {owner}", the Mozart wordmark, and "● Tap to listen & make your own".
  - About 40–44 KB.
  - DM Sans Medium/Bold TTFs (latin subset) and the OFL licence are committed in `assets/fonts/`; output tracing includes them for Vercel.
- **Default preview:** `app/opengraph-image.tsx` (the wordmark plus four mode dots on `#121212`) and root-layout metadata, so `/` unfurls too.
- **Recipients:** a shared link opens signed out on the recipient player (200, "Sent by {owner}"), never autoplays, and plays on tap. `/audio/*` is public. The recipient's sheet shares the same clean URL.
- **Vercel:**
  - `pnpm build` succeeds with only `DATABASE_URL`, `SESSION_SECRET` and Vercel's own variables (no `.env.local`, no migrations).
  - Session cookies are `Secure` in production.
  - `proxy.ts` returns a hard 404 for `/dev/*` when `VERCEL_ENV=production`, checked per request, so a promoted preview build is covered. The `/dev` pages also check (`lib/server/dev-gate.ts`) and are no longer prerendered.

### Verified
- `pnpm typecheck`, `pnpm lint`, `pnpm build`: no errors.
- `pnpm test:unit`: 24/24:
  - `getAppUrl` in each environment;
  - share-message encoding (quotes, ×, &, #, emoji);
  - clean URLs;
  - OG title wrapping and truncation.
- `pnpm test:e2e`: **48/48**, twice in a row. New `share.spec.ts`:
  - clipboard contents, "Copied ✓" and its revert, the manual fallback;
  - the WhatsApp message;
  - recipient-preview and signed-out sheets;
  - crawler HTML, image size and dimensions;
  - 404 metadata, no autoplay, public audio.
- `curl -A "WhatsApp/2.23.20.0 A"` and `-A "facebookexternalhit/1.1"`: all OG and Twitter tags are inside `<head>` in the first response, with no `Set-Cookie`.
- Simulated Vercel:
  - **Preview** (no APP_URL): `og:url` and `og:image` on `https://$VERCEL_URL`; `/dev` works.
  - **Production** (APP_URL set): both on APP_URL; `/dev/*` returns 404.
- Screens 03-05, 03-06, 05-01, 05-07, 06-07: same diff as M3 (0.17–1.05%), no drift.
- OG images checked by eye: *Cinematic pop* (`new`, yellow), *In Too Deep × Bollywood* (cover, purple), *Cruel Summer × Bollywood* (remix, orange), and a long Vibe title (*Cruel Summer × Make it a stripp…*).

### Decisions
- **URL order:** APP_URL (local and Production) → `https://$VERCEL_URL` (Previews) → request origin → 127.0.0.1.
- **Share message:** `“{title}” — I made this on Mozart. Listen and make your own version: {url}`, in one helper.
- **`noindex, nofollow`** on track pages: reachable by link, not by search.
- **OG image design:** flat, design-system colours, the maker's initial on the artwork (as in the app), under 50 KB.
- **`htmlLimitedBots` is not set.** Track pages block on the request (`instant = false`), so WhatsApp and Facebook already get the tags in `<head>`. Setting it would replace Next's default bot list. The e2e tests guard this.
- **Gating `/dev` at the proxy:** Next 16 streams `notFound()` to browsers as a 404 page with status 200. The proxy gives a real 404 status.
- **`og:image` host in development:** Next uses `http://localhost:3000` for file-based images (its dev rule); `og:url` is `127.0.0.1`. On previews and in production both are correct.

### Assumptions
- WhatsApp is the only external share row, as designed. There's no Web Share "More" row, because the design has none.
- The OG artwork shows the maker's first initial, as the in-app artwork does.

### Known gaps
- In production builds, a missing track shows the 404 page with **status 200 to browsers**: Next 16 streams `notFound()`. Crawlers get a real 404.
- Text renders up to 1 pt lower than the PNGs (the DM Sans difference).
- Three tracks you made while testing M3 (Delilah × A summer roadtrip, Delilah × First dates, Euphoric electronic pop) are still in Ali's library. Delete them for a clean demo (re-seeding doesn't remove them).

### TODOs left for later milestones
- **M5:**
  - `app/api/generate/route.ts` and `lib/client/use-generate.ts`: anonymous recipients make one track (`mozart_anon`) instead of getting a 401;
  - wire `recipientResult` and claiming.
- **M6:**
  - `components/audio/AudioProvider.tsx`: remove the pause-on-leave effect;
  - `components/audio/MiniPlayer.tsx`: drive it from `useAudio()`.
- **M7:** `app/auth/spotify/login/route.ts`: real Spotify OAuth.


## Milestone 3 — Generate · done (PR #3, merged)

Tapping Generate makes a real track. It's named by the naming rule, saved to the user's library, and plays catalogue audio. Playing, pausing and seeking run through one global `<audio>` element.

### Built
- **Audio:** eight files in `public/audio/` (25 MB). Your placeholder recordings were re-encoded to 128 kbps MP3 with their metadata stripped; `_incoming/` is gone.
- **`lib/config/audio-catalogue.ts`:** tags each file so every genre, singer, theme and idea has at least one file:

| File | Was | Duration | Genres | Singers | Themes | Ideas / moods |
| --- | --- | --- | --- | --- | --- | --- |
| `bollywood-strings.mp3` | Golden Minaret | 3:08 | bollywood, classical | arijit-singh | falling-in-love, missing-home | pop-punk-bollywood; filmi, strings, romantic |
| `acoustic-lofi.mp3` | Prayer Rug | 3:28 | lo-fi, jazz | billie-eilish | missing-home, self-love | rainy-day-lofi; acoustic, rainy, chill, stripped |
| `electronic-dance.mp3` | Chrome Dress | 2:28 | electronic, disco | fred-again, dua-lipa | a-night-out, payday | euphoric-anthem; euphoric, dance, club, summer |
| `pop-punk-guitars.mp3` | Static Bloom | 2:32 | pop-punk, metal | — | heartbreak, growing-up | punk, rock, guitar, breakup |
| `drill-afrobeats.mp3` | Coin Call | 2:27 | drill, afrobeats | kendrick-lamar | my-best-friends, payday | rap, hip hop, grime, trap |
| `late-night-garage.mp3` | Quarter Tone | 2:43 | — | the-weeknd | a-night-out, first-dates | late-night-garage; garage, night, bus, r&b |
| `country-roadtrip.mp3` | One Box | 3:18 | country | taylor-swift | a-summer-roadtrip, moving-to-london | country, folk, storytelling, roadtrip |
| `cinematic-pop-ballad.mp3` | Own Key | 3:18 | k-pop | — | falling-in-love, self-love | pop, ballad, cinematic, piano |

- **How audio is picked** (`lib/server/generate/pick-audio.ts`, server-only):
  1. An exact tag match on the mode's choice: genre (Remix), singer (Cover), theme (Rewrite) or idea (Something new).
  2. For free text (Vibe, Something new), the file sharing the most keywords with the text.
  3. Otherwise a pick from the mode's files, then from all files, using a SHA-256 hash of the request, so the same request always gets the same file.

  It never returns the source track's own file when another option exists.
- **Naming and validation** (`lib/generation-input.ts`, shared): the per-mode `GenerateInput` union, a hand-written validator and `titleFor`.
  - The name is `{root song} × {change}`. The root comes from the source song, or from the source track's stored `rootSong`, so a chain never gets a double ×.
  - Vibe free text is trimmed to ~24 characters at a word boundary; Something new to ~32, or the idea's label. A trailing small word ("the", "about" …) is dropped. Sentence case capitalises the first letter only.
  - Genres, singers, themes and ideas now have stable ids. Ideas also have short labels ("Euphoric electronic pop", "Pop-punk Bollywood breakup", "Late-night UK garage", "Rainy-day lo-fi").
- **`POST /api/generate`:**
  - 400 for invalid input, with a readable message;
  - 401 `signin_required` when signed out (`TODO(M5)`);
  - 404 for an unknown source track;
  - 429 over 20 per user per 10 minutes, counted from `tracks`;
  - otherwise 201 with `{ track: { id, slug, title, mode, audioUrl } }`.

  It uses a 10-character slug (retried on collision) and stores `rootSong`, `rootArtist`, `audioId` and `label` in `generation_input`. Errors are JSON only; nothing internal leaks.
- **Generate in the UI** (`lib/client/use-generate.ts`):
  - shows the mode's Generating screen at once and calls the API in parallel;
  - opens `/track/{slug}?autoplay=1` once the request has succeeded and 3.5 s have passed;
  - a double tap sends one request;
  - on any failure other than a 401: "Couldn’t make that one. Try again." with **Try again** / **Back**, keeping your choices;
  - track routes pass the real `sourceTrackId`, looked up on the server.

  Every Generate ends on its new track.
- **Global audio** (`components/audio/AudioProvider.tsx`, in the root layout): one `<audio preload="metadata">` and `useAudio()`.
  - Progress updates through `requestAnimationFrame`; a blocked autoplay stays paused; media errors set `error`; Media Session gets the title and artist.
  - The `Player` binds play/pause, the bar and the times to its own track. If a different track is loaded, it shows paused at 0:00 until played.
  - The bar is a `role="slider"`: tap or drag, arrow keys ±5 s, Home / End.
  - The duration comes from metadata, falling back to the catalogue.
- **Seed:** the six tracks use catalogue files and store `rootSong` / `rootArtist` / `audioId`. Re-running is still safe.
- **The Library** is uncached (dynamic and session-scoped), so new tracks show at the top as "Today".

### Verified
- `pnpm typecheck`, `pnpm lint`, `pnpm build`: no errors. `pnpm db:seed` twice: still 1 user and 6 tracks.
- `pnpm test:unit`: 12/12 (naming rules, validation, audio picking).
- `pnpm test:e2e`: **39/39**, twice in a row. `generate.spec.ts` covers:
  - all four create modes, from-player Remix (*Cruel Summer × Lo-fi*) and Vibe (*Cruel Summer × Make it a stripped-back*): each makes a new slug with the right title and a catalogue file, first in the Library;
  - the Generating screen stays ≥ 3.5 s, and a double tap makes one track;
  - Back from the new player returns to the step;
  - play/pause/seek on the real element;
  - no autoplay on a direct open;
  - leaving the player pauses;
  - API 400/401.

  Test-created tracks are deleted after each test (`tests/e2e/helpers/db.ts`); seeded tracks are never touched. 0 leftover rows.
- Screens after the change, no drift from M2:
  - 03-01…03-04 Generating: 0.10–0.22%;
  - 03-05 player: 0.17%;
  - 04-01…04-04: 0.90–1.40%;
  - 04-05: the keyboard, as before;
  - 07-01: 1.29%.
- Scripted walk-through at 390 px: Rewrite → Payphone → Heartbreak → Generating → *Payphone × Heartbreak* playing `pop-punk-guitars.mp3`; dragging the bar seeks; leaving pauses; the track tops the Library as "Today".

### Decisions
- **`?autoplay=1`** is set only by Generate. The player reads it once, plays (a blocked play stays paused) and removes it from the URL. A shared or library link never autoplays.
- **Generate uses `router.push`, not `replace`.** The Generating screen has no URL of its own, so `replace` would drop the step screen from history, and Back would skip it. `push` gives what was asked for: Back from the new player lands on the step screen. Next 16 keeps that screen's state on Back, so the hook resets to the form, choices intact.
- **Pause on leaving the player** until M6: `AudioProvider` pauses whenever the path isn't `/track/{slug}`. That includes step 2 from a player. It's one effect, marked `TODO(M6)`.
- **The 401 fallback** until M5: after the Generating screen, a signed-out maker returns to the source (player or step). Signed-out users can't reach the Create flows anyway.
- **Rate limit:** 20 generations per user per 10 minutes, counted from `tracks` (no new table).
- **Unit tests** use Node's built-in runner (`pnpm test:unit`, `tsx --test`, with `--conditions=react-server` so `server-only` imports work). No new dependency.
- The error state copy is "Couldn’t make that one. Try again."; there's no PNG for it. It uses the mode colour, a dark Try again button and an outlined Back.

### Assumptions
- The recordings' real styles are unknown. The roles in the table are assigned so different choices sound different. Ideas got short labels for titles (only "Euphoric electronic pop" comes from the designs).
- Something new with an edited idea text counts as free text. Only the untouched idea uses its label.

### Known gaps
- Text renders up to 1 pt lower than the PNGs (the DM Sans build difference from M2).
- Turbopack can serve stale CSS after editing `app/globals.css`: restart `pnpm dev`.

### TODOs left for later milestones
- **M5:**
  - `app/api/generate/route.ts`: let anonymous recipients make one track (`mozart_anon`) instead of returning 401;
  - `lib/client/use-generate.ts`: the matching client path;
  - wire `recipientResult` and claiming.
- **M6:**
  - `components/audio/AudioProvider.tsx`: remove the pause-on-leave effect;
  - `components/audio/MiniPlayer.tsx`: drive it from `useAudio()`, and decide when it appears (01-03, 07-02).
- **M7:** `app/auth/spotify/login/route.ts`: real Spotify OAuth.


## Milestone 2 — Static UI · done (PR #2, merged)

All 39 main-flow screens exist, built from shared components, and are connected as `docs/flow-index.md` says. Data comes from the DB (users, tracks) and `lib/config/`. Generation, audio, sharing and anonymous logic are not built yet (M3–M6); their UI is built and ready to wire.

### Routes
- `/create`: 01-02 Create home. The avatar opens a menu with **Log out** (the design has an avatar, so Log out lives there).
- `/create/remix|cover|rewrite`: step 1 (02-01, 02-03, 02-05). A search box filters the 16 songs.
- `/create/[mode]/[songId]`: step 2 (02-02, 02-04, 02-06). Generate stays disabled until an option is picked. Unknown modes and songs return 404.
- `/create/new`: Something new (02-07, 02-08).
- Every Generate shows the Generating screen in the mode colour for ~3.5 s (03-0x / 06-0x), then opens the player:
  - from the Create flows → `/track/cruel-bolly`;
  - from a player → that track.
- `/track/[slug]`: the player. Loads the track and owner from the DB (404 if missing); no sign-in needed.
  - Signed-in owner → `creator` (03-05); anyone else → `recipient` (05-01).
  - `?view=recipient` lets the owner preview the recipient view ("Open as recipient").
  - `?share=1` opens the share sheet.
  - `?share=1&saved=1` (the Send-to `returnTo`) opens the sheet and shows "Signed in · saved to your library" once (06-07). The chevron reads "Close player" (06-08), then `router.replace` drops both params.
- `/track/[slug]/remix|cover|rewrite|vibe`: step 2 from a player (04-xx owner, 05-xx others), using the same StepTwo component with no step counter.
- `/library`: 07-01. Ali's tracks, newest first, with a REMIX badge on derived tracks and Today / Yesterday / "3 Oct" dates.
- `/dev/screens`, `/dev/screens/[id]`, `/dev/compare/[id]`: the gallery, rendering all 39 screens with the real components in their design states. Returns 404 when `VERCEL_ENV=production` (covered by e2e).
- Not reachable by route yet, gallery only:
  - `recipientResult` (06-05, 06-06) arrives in M5;
  - the mini player (01-03, 07-02) arrives in M6;
  - 05-07 has no entry point in the flow index.

### Shared components
- **Pattern components (one each, with variants):**
  - `Player` (creator / recipient / recipientResult)
  - `StepTwo` (remix / cover / rewrite / vibe; from Create or from a player)
  - `GeneratingScreen`
  - `BottomSheet` (dimmed backdrop, X / backdrop / Escape close, focus trap) and the sheets built on it: `ShareSheet`, `SignupSheet`
  - `SongPicker`, `StepOne`, `SomethingNew`
  - `MiniPlayer`
- **Smaller pieces:** `ModeCard`, `ModeTile`, `PillBackButton`, `StepHeader`, `TabBar`, `ProfileMenu`, `Pill`, `PrimaryButton`/`ModeButton`, `Toast`, `Artwork`.
- **Config:** `lib/config/songs|genres|singers|themes|ideas.ts`. Mode colours, labels and icons all come from `lib/config/modes.ts`.

### Verified
- `pnpm typecheck` (runs `next typegen` first), `pnpm lint` and `pnpm build`: no errors.
- `pnpm db:seed` twice: still 1 user, 6 tracks.
- `pnpm test:e2e`: **27/27**, run three times in a row. `navigation.spec.ts` clicks by flow-index names:
  - all four create flows end to end;
  - back and "change song" links;
  - Library order and tabs;
  - share sheet: closes by X, backdrop and Escape; Open as recipient;
  - every player tile → step 2 → Back;
  - Generate from a player;
  - signed out: Save → Send to Ali → Continue with Spotify → back with sheet + toast, and the params are gone after a refresh;
  - `/create` and `/library` redirect when signed out;
  - 404s;
  - all 39 gallery routes;
  - `/dev` returns 404 under `VERCEL_ENV=production`.
- At 1280 px, all four create flows, step 2, the player (with its sheet) and the Library are one centred 390 px column on `#121212`.
- Visual check, `pnpm shots` + `pnpm shots:diff` and side-by-side crops. "Font offset" = text ≤1 pt lower than the PNG (see Known gaps):

| Screen | Diff | Result |
| --- | --- | --- |
| 01-01 Landing | 0.08% | Match |
| 01-02 Create home | 0.82% | Match; font offset |
| 01-03 Create home + mini player | 1.00% | Match; font offset |
| 02-01 / 02-03 / 02-05 Step 1 | 1.86–1.89% | Match; font offset on 16 titles and initials |
| 02-02 / 02-04 / 02-06 Step 2 | 0.81–1.31% | Match; font offset |
| 02-07 Something new | 0.60% | Match |
| 02-08 Something new, typed | 23.84% | Match above the keyboard. The design draws an iOS keyboard; the device supplies it, so Generate sits at the bottom here |
| 03-01…03-04 Generating | 0.10–0.22% | Match |
| 03-05 Player · creator | 0.17% | Match |
| 03-06 Share sheet | 0.82% | Match except the omitted "If time" badge |
| 04-01…04-03 From player | 0.92–1.40% | Match; font offset |
| 04-04 Vibe | 0.90% | Match |
| 04-05 Vibe, typed | 24.34% | As 02-08 (keyboard) |
| 05-01 Player · recipient | 0.21% | Match |
| 05-02…05-05 Recipient step 2 | 0.90–1.40% | Same as 04-xx |
| 05-06 Recipient Vibe, typed | 24.34% | As 02-08 (keyboard) |
| 05-07 Share · recipient | 0.78% | Match except the "If time" badge |
| 06-01…06-04 Generating | 0.11–0.23% | Match |
| 06-05 Recipient's remix | 0.27% | Match |
| 06-06 Send to Ali | 0.30% | Match |
| 06-07 Back from Spotify | 1.05% | Match except the "If time" badge |
| 06-08 Signed in, creator player | 0.19% | Match |
| 07-01 Library | 1.29% | Match; font offset (live dates are relative) |
| 07-02 Library + mini player | 1.47% | Match; font offset |

### Decisions
- **Gallery** at `/dev/screens` is the place to review every state, including ones not reachable by route yet. `/dev/compare/<id>` shows a screen beside its design. Captures come from gallery routes, so dates and states are frozen to the designs.
- `?view=recipient`, `?share=1` and `?saved=1` on `/track/[slug]` (see Routes).
- **Log out** is in the Create home avatar menu. It's a native `<details>`, so it works before hydration.
- The designs win over the brief:
  - Something new has **no idea chips**. The ideas rotate as ghost text with dots, and Generate with an empty box uses the idea on screen.
  - Vibe-from-player Generate stays enabled as designed; with an empty box it focuses the box.
- `html { line-height: normal }` to match the designs (Tailwind's default is 1.5). Design CSS is content-box, so sizes include borders: 81 px library rows, 22 px badges, 172 / 134 / 202 px text boxes, 142 / 172 px landing tiles.
- An e2e-only second dev server (port 3100, `NEXT_DIST_DIR=.next-prodcheck`, `VERCEL_ENV=production`) checks the `/dev` gate.

### Assumptions
- The "If time" badge on WhatsApp is a designer's scope note, so it's omitted.
- The drawn iOS keyboard (02-08, 04-05, 05-06) is not rendered; the device supplies it.
- Step 2 with nothing picked shows only the lead ("…but make it"). The designs show only picked states.
- Player and mini-player art is the crossed placeholder from the designs; Library art is a plain square; pickers use initials.
- Generating quotes come from `lib/generation.ts`. For someone else's track: "Ali’s Cruel Summer, …". For Vibe: "…, but {prompt}."
- `In Too Deep × Bollywood` is seeded as a cover by Arijit Singh. A track with no owner shows "a friend" / "You".
- The Send-to sheet copy ("save your remix") is the same on 05-01 as on 06-06, since the designs have only one version.

### Known gaps
- **Font offset:** text renders up to 1 pt lower than the PNGs throughout. It's a DM Sans build difference between `next/font` and whatever rendered the designs: positions and boxes match, glyphs sit slightly lower. The variable font with optical sizing was tried and is worse.
- **Turbopack CSS hot reload** sometimes serves stale CSS after editing `app/globals.css`. Restart `pnpm dev` and delete `.next/dev` if a style change doesn't show.
- **Dev-log noise:** the e2e prod-check server logs "Could not validate `instant`" errors when `/dev` 404s on purpose. Harmless.

### TODOs left for later milestones
- **M3:**
  - `lib/client/use-generate.ts`: replace the mock with `POST /api/generate`;
  - `app/create/[mode]/[songId]/page.tsx`, `app/create/new/page.tsx`, `app/track/[slug]/[mode]/page.tsx`: open the newly made track;
  - `components/audio/Player.tsx`: drive the global `<audio>`.
- **M5:** make `recipientResult` reachable; the anonymous cookie, the one-make limit and claiming.
- **M6:** `components/audio/MiniPlayer.tsx`: real play/pause and when the mini player appears (01-03, 07-02). Tabs carrying the mini player.
- **M7:** `app/auth/spotify/login/route.ts`: real Spotify OAuth; it currently signs in as Ali.


## Milestone 1 — Foundations · done (PR #1, merged)

### Built
- **01-01 Landing / Sign in** at `/`, matching the design at 390 × 844. Signed-in visitors are redirected to `/create`.
- `/create`: **temporary placeholder** ("Signed in as {firstName}" + Log out). The real Create home (01-02) is milestone 2.
- Design tokens in `app/globals.css` (`bg-surface`, `text-secondary`, `bg-remix`, `rounded-tile` …), DM Sans 400–700, a centred 390 px column on `#121212`.
- `lib/config/modes.ts`: label, tagline, colour and icon paths for `remix | cover | rewrite | vibe | new`.
- Database: `users` + `tracks` only (`lib/server/db/schema.ts`, migration in `drizzle/`). The seed upserts Ali and *Cruel Summer × Bollywood* (`cruel-bolly`).
- Sessions: iron-session cookie `mozart_session` (`lib/server/session.ts`): `getSession`, `getCurrentUser`, `requireUser`, `getAnonId` (read-only).
- Routes:
  - `POST /auth/dummy` and `GET /auth/spotify/login` sign in as Ali (Spotify = the silent fallback until M7).
  - `POST /auth/logout`.
  - `GET /api/me`.
  - `returnTo` accepts only same-site paths and defaults to `/create`.
- Tooling:
  - `pnpm shots [id]` captures screens to `.shots/{id}.png`; register screens in `scripts/shots.config.ts`.
  - `pnpm shots:diff [id]` compares a capture with its design PNG.
  - `pnpm test:e2e` runs Playwright (starts or reuses `pnpm dev`).

### Verified
- `pnpm typecheck`, `pnpm lint` and `pnpm build`: no errors.
- `pnpm db:seed` twice: no errors; still 1 user and 1 track. The DB has exactly two tables (`tracks`, `users`).
- `pnpm test:e2e`: 7/7 green (three runs). Covers:
  - landing copy and buttons;
  - Log in → `/create` "Signed in as Ali";
  - Connect Spotify → same;
  - Log out → `/`;
  - signed-in `/` → `/create`, and signed-out `/create` → `/`;
  - `/api/me` signed out and signed in;
  - `returnTo` of `//evil.com`, `https://evil.com` and `/\evil.com` ignored.
- **01-01 compared with the design.** `.shots/01-01.png` vs `docs/designs/png/01-01_landing-sign-in.png`, using `pnpm shots:diff`: 0.08% of pixels differ, all glyph anti-aliasing. Layout, sizes, colours, radii, icons and copy match. Fixed along the way:
  - Artwork tiles were 2 pt small: the design boxes are content-box (140/170 + border).
  - The wordmark sat ~1 pt low: line-height pinned at 30 px.
  - The Next.js dev badge is hidden in captures.
- At 1280 px: one centred 390 px column on `#121212`, no horizontal scroll.
- No secret values in `.next/static`, no `NEXT_PUBLIC_` variables. DB code lives only in `lib/server/`.

### Decisions
- Modes include `new` ("Something new", from scratch) alongside `vibe` (from a player).
- The app always runs on `http://127.0.0.1:3000` (`pnpm dev` binds there). Auth redirects use a relative `Location`, because in dev `request.url` reports `localhost` and an absolute redirect would drop the cookie.
- Pages that read the session use `export const instant = false`, so redirects are real 307s rather than streamed. `getSession()` calls `connection()` because iron-session uses `Date.now()`.
- The dummy user has a fixed id (`lib/config/dummy-user.ts`), so seeding and `/auth/dummy` upsert the same row.
- `next dev` writes two blocks into `AGENTS.md` (agent rules + `agentFeedback`). They're committed to keep the tree clean.

### Assumptions
- The designs have no Vibe tagline; I used "Same song, your way." (from its "…but your way." prompt).
- `docs/fixtures/spotify/` doesn't exist, so the taste shape follows tech-spec §4 (`lib/types/taste.ts`), with an `artists[]` array added next to the `artist` display string. Mock ids are `mock-track-NN` / `mock-artist-NN`, and image URLs are `null` (grey initials placeholders).
- `MOCK_TASTE.genres` is an invented list (pop, filmi, electronic, pop punk, hip hop, r&b).

### Known gaps
- `/create` is a placeholder; the real Create home is M2.
- `public/audio/placeholder.mp3` doesn't exist yet (M3 adds the audio catalogue).
- No Vercel preview is connected to the repo, so testing is local.
- Supabase: right after the database password was reset, the pooler rejected some new connections (`28P01`), then briefly locked out new connections (`ECIRCUITBREAKER`). It cleared by itself within ~10 minutes. If `pnpm db:migrate` hangs on port 6543, set `DATABASE_URL_MIGRATE` to the same URL on port 5432.

