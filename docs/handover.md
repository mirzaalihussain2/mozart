# Handover — start here

Read `AGENTS.md` first (rules, stack, design system, git workflow). This page is everything else a new session needs. Look up `docs/flow-index.md` and `docs/designs/` only for the screens a task touches.

## Status

**v1 is complete.** Milestones 1–7 are merged (PRs #1–#7); M8 closes off v1 (PR #9). It's live at **https://mozart-iota.vercel.app**. The production check passed: the full loop works, including real Spotify sign-in and the WhatsApp preview. There's no next milestone; see **Later** at the end of this page.

The core loop works end to end:
1. Ali signs in (Spotify or "Log in") and makes a track (Remix / Cover / Rewrite / Something new).
2. Ali shares the link.
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

- **Ports:** `PORT`, `E2E_PORT` (its production-gate twin is `+ 99`) and `FAKE_SPOTIFY_PORT` override 3000 / 3001 / 4545 for parallel worktrees; see the README. New worktrees need a copy of `.env.local`. With several worktrees busy at once the machine overloads: start `pnpm dev` before `pnpm shots` (its own start-up wait can time out), and run e2e with `--workers=2`. The core-loop test then needs the most headroom against its 30 s timeout.
- **iPhone checks:** run Playwright's WebKit with `devices["iPhone 14"]` and a 390 × 844 viewport (`pnpm exec playwright install webkit` once). It has no on-screen keyboard and reports every safe-area inset as 0, so test those two on a real phone.
- **`/dev/screens`:** every one of the 39 screens in its design state (real components and fixtures). `/dev/compare/{id}` shows a screen beside its PNG. `/dev/*` is a hard 404 in production (`proxy.ts`).
- **Before calling a screen done:** diff it, open both images and compare. The baseline after M8 is ≤ 1.9% everywhere, except 02-08, 04-05 and 05-06 (~24%: the design draws an iOS keyboard, which the app leaves to the device).
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
- **Safe areas:** `viewport-fit=cover`; the design's bottom spacing is kept and only grows to `env(safe-area-inset-bottom)` when the device needs more (`max(…)` on the tab bar, bottom sheets and player). Tops need nothing: iOS Safari and home-screen apps without `black-translucent` start the page below the status bar.
- **Keyboard:** Something new and Vibe use `useKeyboardViewport` (`lib/client/use-keyboard-viewport.ts`). While the box is focused and the keyboard covers the screen, the screen is pinned to `visualViewport`, so Generate sits just above the keyboard (02-08, 04-05). iOS never shrinks `h-dvh` for the keyboard.
- **404 / errors:** `app/not-found.tsx` and `app/error.tsx` share `components/ui/ErrorScreen.tsx` (landing layout, no design). "Back to Mozart" goes to `/create` when `/api/me` says signed in, else `/`.
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

- **`.env.local`:** `DATABASE_URL` (Supabase pooler :6543), `SESSION_SECRET`, `APP_URL=http://127.0.0.1:3000`, `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`. Local and production share **one** database.
- **Vercel:** `DATABASE_URL`, `SESSION_SECRET` and the Spotify credentials (Production + Preview); `APP_URL=https://mozart-iota.vercel.app` (Production only). Both Spotify redirect URIs are registered. Previews sit behind Vercel's login, so WhatsApp can't unfurl them: test previews on production.
- **Test data:** as of 9 Oct 2026 the database holds 9 tracks from manual testing (7 Ali, 2 Sam) on top of the seed; listed in PR #9 and kept until Ali says to delete them. Re-seeding doesn't remove them. Never delete seeded tracks or Spotify users' tracks.

## Known gaps (v1)

- **No cross-device claiming:** an anonymous make is tied to that browser's `mozart_anon` cookie. Clearing cookies loses it and resets the one-make limit.
- **No saving others' tracks:** signing in from 05-01 makes you Sam viewing Ali's track; nothing is added to your library.
- **Playback isn't kept after a reload**, and there's **no queue**.
- **Something new ideas aren't personalised**; neither are genres or themes (Spotify returns no genres). Song and singer pickers are.
- **Previews use the dummy sign-in:** Vercel previews always fall back to a demo user. The dummy sign-in is a plain request with no CSRF protection; real Spotify uses state + PKCE.
- **Spotify Development Mode** allows only 5 allowlisted users; everyone else silently becomes a demo user.
- **Generating flash:** a brief Generating screen can show when the page's view of the one-make limit is stale (e.g. a second tab).
- **Keyboard and safe areas** were checked in WebKit with a simulated keyboard and zero insets, not on a physical iPhone.

## Later

- **Parked design ideas:** idea chips under Something new, a "More" (native share) row in the share sheet, and personalised genres, themes and ideas.
- **Real AI generation** in place of the mock catalogue (`lib/server/generate/`).
- Cross-device claiming, saving other people's tracks, playback that survives a reload, and a queue (the gaps above).
