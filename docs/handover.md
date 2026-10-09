# Handover — start here

Read `AGENTS.md` first (rules, stack, design system, git workflow). This page is everything else a new session needs. Look up `docs/flow-index.md` and `docs/designs/` only for the screens a task touches.

## Status

Milestones 1–7 are merged to `main` and live on Vercel (PRs #1–#7). **Next: Milestone 8 — polish + E2E**:
- the full core-loop test green;
- the WhatsApp preview check on production;
- a visual pass over all 39 screens.

The core loop works end to end, as the code and e2e tests show:
1. Ali signs in (Spotify or "Log in") and makes a track (Remix / Cover / Rewrite / Something new).
2. He shares the link.
3. A friend with no account opens it and listens.
4. The friend makes **one** version anonymously → "Send to Ali" → signs in.
5. The friend lands back on **their** track, claimed into their library, with the share sheet open and the toast "Signed in · saved to your library".

## Run and verify

```bash
pnpm i && pnpm db:migrate && pnpm db:seed && pnpm dev   # http://127.0.0.1:3000 — never localhost
pnpm typecheck && pnpm lint && pnpm build                # typecheck runs `next typegen` first
pnpm test:unit                                           # node:test via tsx (--conditions=react-server)
pnpm test:e2e                                            # own app on :3001 (.next-e2e) + fake Spotify on :4545
pnpm shots [id] && pnpm shots:diff [id]                  # capture /dev/screens/{id} at 390×844@3x, diff with docs/designs/png
```

- **`/dev/screens`:** every one of the 39 screens in its design state (real components and fixtures). `/dev/compare/{id}` shows a screen beside its PNG. `/dev/*` is a hard 404 in production (`proxy.ts`).
- **Before calling a screen done:** diff it, open both images and compare. The baseline after M7 is ≤ 1.9% everywhere, except 02-08, 04-05 and 05-06 (~24%: the design draws an iOS keyboard, which the app leaves to the device).
- **E2E rules:** tests delete every track they create (`tests/e2e/helpers/db.ts`) and never touch the seeded tracks; Sam may stay. Tests that check "first in the Library" must allow for other spec files adding tracks in parallel.

## Code map

| Area | Where |
| --- | --- |
| DB (only `users`, `tracks`) | `lib/server/db/schema.ts`, migrations in `drizzle/`, seed `scripts/seed.ts` (Ali, Sam, Ali's 6 tracks; idempotent) |
| Session / anonymous id | `lib/server/session.ts` (`mozart_session`, iron-session), `lib/server/anon.ts` (`mozart_anon`) |
| Sign-in | `lib/server/auth/`: `complete-sign-in.ts` (**the only place sign-in finishes**), `personas.ts`, `claim.ts`, `spotify-user.ts`; routes `app/auth/{dummy,logout,spotify/login,spotify/callback}` |
| Spotify | `lib/server/spotify/` (`client.ts` = every Spotify call, `pkce.ts`, `oauth-cookie.ts`), `lib/spotify/map-taste.ts`, `lib/server/taste.ts` (`getTasteFor`, `catalogueFor`) |
| Generation | `app/api/generate/route.ts`, `lib/server/generate/{create-track,pick-audio}.ts`, `lib/generation-input.ts` (validator, `titleFor`), `lib/client/use-generate.ts` |
| Who's viewing a track | `lib/server/viewer.ts` → player variant + sign-in prompt |
| Audio | `components/audio/AudioProvider.tsx` (one `<audio>`, `useAudio()`), `Player.tsx`, `MiniPlayer.tsx`, `NowPlayingSlot.tsx`, `lib/audio-routes.ts` |
| Sharing / previews | `components/sharing/`, `lib/share-message.ts`, `lib/server/app-url.ts` (`getAppUrl`, `trackUrl`), `app/track/[slug]/opengraph-image.tsx` |
| Static config | `lib/config/`: modes (colours, icons, hex), songs/singers (derived from a taste), genres, themes, ideas, audio catalogue (8 MP3s in `public/audio/`), mock taste, personas |
| Gallery fixtures | `lib/dev/fixtures.ts`, `app/dev/screens/registry.tsx` |

## How it behaves (decisions — don't re-open)

- **Personas:** "Log in" (`POST /auth/dummy`) is always **Ali**. The dummy fallback picks the first persona who isn't the owner of the `returnTo` track, so signing in from Ali's track gives **Sam**. This is decided on the server, never from the client.
- **Spotify:** Authorization Code + PKCE.
  - Any failure (cancel, a non-allowlisted 403, 429, a 5 s timeout, bad state) **silently** becomes the dummy persona, at the same destination.
  - Vercel previews always use the fallback.
  - No tokens are stored; taste is fetched once per sign-in.
  - Spotify users with ≥ 6 top tracks see their own songs and singers; everyone else gets `MOCK_TASTE`. The validator uses the same per-viewer catalogue.
- **Anonymous recipients:**
  - The `mozart_anon` cookie (UUID) is set only when they make their first track, by `POST /api/generate`.
  - They get one make, only from a track; this is enforced on the server (403 `anon_limit`).
  - Anonymous tracks are unowned. They show "You" to the maker and "A friend" to everyone else, including previews.
- **Claiming:** `completeSignIn` sets the session, claims this browser's unowned tracks in one atomic UPDATE, deletes `mozart_anon`, and adds `saved=1` **only if something was claimed**. After making a track, sign-in returns to *their* track with `?share=1`.
- **Player variant:** owner → `creator`; this browser's anonymous maker → `recipientResult`; everyone else → `recipient`. Signed-in non-owners get no sign-up prompts. `?view=recipient` previews the recipient view.
- **Track URL parameters:** `?share=1` opens the share sheet. `?saved=1` shows the toast once and labels the chevron "Close player". `?autoplay=1` is only ever set by Generate. The Player strips all three from the URL after reading them.
- **Naming:** `{root song} × {change}`. The root song is stored in `generation_input.rootSong`, so a chain never gets a double ×. Free text is trimmed (Vibe ~24 chars, Something new ~32 or the idea's label).
- **Audio picking:** an exact tag match → free-text keywords → a hashed fallback. It's deterministic, and never the source track's own file when another exists.
- **Playback:** music keeps playing on `/track/{slug}`, `/create` and `/library`. Everywhere else it pauses but stays loaded. The mini player shows only on `/create` and `/library`. Minimise keeps playing; Close player and Log out call `stop()`.
- **Generate:** the Generating screen shows for ≥ 3.5 s. Generate uses `router.push` (not `replace`), so Back returns to the step screen. Errors show Try again / Back.
- **Rate limits:** 20 makes per user per 10 minutes; 30 anonymous makes per 10 minutes app-wide (counted from `tracks`).
- **URLs:** one helper: `APP_URL` → `https://$VERCEL_URL` → request origin → 127.0.0.1.
- **Previews:** track pages are `noindex` and their Open Graph tags are never viewer-specific. The preview image is 1200×630, about 44 KB.
- **Where I followed the designs over the briefs:**
  - Something new has no idea chips; the ideas rotate inside the box, and Generate with an empty box uses the idea shown.
  - The WhatsApp row has no "If time" badge.
  - There's no "More" share row.
  - Player and mini-player art is the crossed placeholder; Library art is a plain square.

## Gotchas (each cost real time)

- **Next 16 `cacheComponents`:** pages that read the session or URL need `export const instant = false`. `getSession()` awaits `connection()`, because iron-session's `Date.now()` trips dev validation. `notFound()` reaches browsers as the 404 page with **status 200** in production (crawlers get 404); `proxy.ts` gives `/dev/*` a real 404.
- **Turbopack serves stale CSS or modules** after edits (e.g. "X is not a function" for a new export). Fix: `pkill -f "next dev"; rm -rf .next/dev; pnpm dev`. Check the served CSS before trusting a capture.
- **Hosts:** in dev, `request.url` and file-based `og:image` say `localhost`. Redirects use a **relative** `Location` (`seeOther`); use `trackUrl()` for absolute URLs.
- **Design CSS is content-box:** add border widths to sizes (81 px Library rows, 22 px badges, 142/172 px landing tiles). Global `line-height: normal` (Tailwind's default is 1.5).
- **Font offset:** text renders up to 1 pt lower than the PNGs. It's a DM Sans build difference; trying the variable font made it worse. Accept it.
- **`next typegen` and a running `next dev`** can corrupt `.next/dev/types`. Delete those files and retry.
- **Playwright's request fixture** doesn't follow `baseURL` for absolute URLs. Cookies ignore ports on 127.0.0.1, which the fake Spotify's scenario cookie relies on.

## Environment

- **`.env.local`:** `DATABASE_URL` (Supabase pooler :6543), `SESSION_SECRET`, `APP_URL=http://127.0.0.1:3000`, `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`.
- **Vercel:** `DATABASE_URL` and `SESSION_SECRET` (Production + Preview), `APP_URL` (Production only). **Check that** `SPOTIFY_CLIENT_ID` / `SECRET` are set and the production redirect URI `{APP_URL}/auth/spotify/callback` is registered in the Spotify dashboard (`http://127.0.0.1:3000/auth/spotify/callback` is registered). Previews sit behind Vercel's login, so WhatsApp can't unfurl them: test previews on production.
- **The database holds 8 tracks from manual testing** (6 Ali, 2 Sam) on top of the seed. Delete them for a clean demo; re-seeding doesn't.

## Known gaps / open items

- **Playback:** no persistence across reloads, no queue.
- **Anonymous:** clearing cookies loses the result and resets the one-make limit; no cross-device claim.
- **Libraries:** no saving of other people's tracks (signing in from 05-01 makes you Sam viewing Ali's track).
- **Generating flash:** a brief Generating screen can show only when the page's view of the limit is stale (e.g. a second tab).
- **Dummy sign-in is a plain GET** that signs in directly (no CSRF protection); real Spotify uses state + PKCE.
- **Spotify:** genres, themes and Something new ideas aren't personalised (Spotify returns no genres); only 5 allowlisted users.
- **Not built for M8:**
  - one test covering the full loop, Create → share → friend → Spotify sign-in, in a single run (today it's split across `recipient-loop.spec.ts` and `spotify.spec.ts`);
  - a check of the WhatsApp preview on production;
  - a final visual pass over all 39 screens.
