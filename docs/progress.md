# Progress

## Milestone 2 — Static UI · done (PR #2, branch `m2-static-ui`)

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
- **M4:** `components/sharing/ShareSheet.tsx`: Copy link (then "Copied ✓") and WhatsApp, using `shareUrl`.
- **M5:** make `recipientResult` reachable; the anonymous cookie, the one-make limit and claiming.
- **M6:** `components/audio/MiniPlayer.tsx`: real play/pause and when the mini player appears (01-03, 07-02). Tabs carrying the mini player.
- **M7:** `app/auth/spotify/login/route.ts`: real Spotify OAuth; it currently signs in as Ali.

## Next: Milestone 3 — Generate

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

