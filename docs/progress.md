# Progress

## Milestone 2 — Static UI · in progress (PR #2, branch `m2-static-ui`)

The instructions I received stopped partway through Step 6 (Player). Steps 0–6 are done; the rest is waiting on the remaining instructions.

### Built (all 39 screens exist and are in the gallery)
- **Gallery**: `/dev/screens` lists all 39; `/dev/screens/[id]` renders each with the real components in its design state; `/dev/compare/[id]` shows it beside the PNG (served by `/dev/designs/[id]`). All `/dev/*` return 404 when `VERCEL_ENV=production` (verified with a production build). `pnpm shots` / `pnpm shots:diff` cover all 39.
- **Create home** `/create` (01-02; 01-03 with the static mini player). The avatar opens a menu with **Log out** (the design has an avatar, so logout lives there).
- **Create flows**:
  - Step 1 `/create/remix|cover|rewrite` (02-01, 02-03, 02-05), with a search box that filters the 16 songs.
  - Step 2 `/create/[mode]/[songId]` (02-02, 02-04, 02-06). Generate is disabled until an option is picked.
  - Something new `/create/new` (02-07, 02-08).
- **Generating** (03-01…03-04, 06-01…06-04): `useGenerate` shows the screen for ~3.5 s, then opens the player. `TODO(M3)`: POST `/api/generate`. From the Create flows it opens `/track/cruel-bolly`; from a player, that track.
- **Player** `/track/[slug]`:
  - Signed-in owner → `creator` (03-05); anyone else → `recipient` (05-01); `?view=recipient` previews the recipient view.
  - `recipientResult` (06-05), the share sheet states (03-06, 05-07, 06-07 + toast) and Send to Ali (06-06) are built and shown in the gallery.
  - Share opens the sheet; the save `+` opens Send to Ali, whose "Continue with Spotify" goes to `/auth/spotify/login?returnTo=/track/{slug}`.
- **From a player** `/track/[slug]/remix|cover|rewrite|vibe` (04-xx creator, 05-xx recipient): the same `StepTwo` component, with no step counter.
- **Library** `/library` (07-01; 07-02 with the mini player): Ali's tracks from the DB, newest first, REMIX badge on derived tracks, Today / Yesterday / "3 Oct" dates.
- **Seed**: Ali owns the six 07-01 tracks (slugs `cruel-bolly`, `cruel-electro`, `deep-bolly`, `euphoric-pop`, `cinematic-pop`, `deep-lofi`), with dates relative to now. Re-running is safe.
- **Shared components**:
  - `components/ui`: BottomSheet (dimmed backdrop, Escape, backdrop and X close, focus trap), Toast, Pill, PrimaryButton / ModeButton.
  - `components/navigation`: PillBackButton, StepHeader, TabBar, ProfileMenu.
  - `components/creation`: ModeCard, SongPicker, StepOne, StepTwo, SomethingNew, GeneratingScreen.
  - `components/track`: Artwork, ModeTile.
  - `components/audio`: Player, MiniPlayer.
  - `components/sharing`: ShareSheet, SignupSheet.
  - `components/library`: LibraryView.
- **Config**: `lib/config/songs|genres|singers|themes|ideas.ts`.

### Verified
- `pnpm typecheck` (now runs `next typegen` first), `pnpm lint` and `pnpm build`: no errors.
- `pnpm db:seed` twice: still 6 tracks, 1 user.
- `pnpm test:e2e`: 17/17 (smoke + `static-ui.spec.ts`, clicking by flow-index names). Covers:
  - Create → Remix → song → genre → Generating → player;
  - step 2 back links;
  - Something new;
  - share sheet closes by X, backdrop and Escape;
  - Open as recipient;
  - player tiles → step 2 → back;
  - Generate from a player;
  - Library → player → Minimise;
  - signed-out recipient + Send to Ali sheet;
  - 404s.
- `pnpm shots` + `pnpm shots:diff` on all 39:
  - 01-01, 03-xx, 05-01, 06-0x players: ≤0.3%.
  - Steps, Create home, Library and sheets: 0.6–1.9%, all text anti-aliasing or the systemic ≤1 pt text offset below.
  - 02-08 / 04-05 / 05-06: ~24%, because of the drawn keyboard.

### Decisions / assumptions
- Designs over the brief, where they disagree:
  - Something new has **no idea chips**. Ideas rotate as ghost text with dots, and Generate with an empty box uses the idea on screen, so it's never disabled.
  - Vibe-from-player Generate stays enabled (as designed); with an empty box it focuses the box.
- The "If time" badge on WhatsApp in the share sheet is a designer's scope note and is omitted.
- The drawn iOS keyboard in 02-08 / 04-05 / 05-06 is not rendered; the device keyboard provides it.
- Player and mini-player art is the crossed placeholder from the designs. Library art is a plain grey square; pickers use initials.
- Step 2 with nothing picked shows the lead ("…but make it") with no coloured word, and Generate is disabled. The designs only show the picked state.
- Generating quotes are built by `lib/generation.ts`. From someone else's track it's "Ali’s Cruel Summer, …"; for Vibe it's "…, but {prompt}."
- `In Too Deep × Bollywood` is seeded as a cover by Arijit Singh (the brief says cover; the title follows the design).
- Recipients see "Sent by {owner}"; an ownerless track says "a friend". `recipientResult` becomes reachable in M5.
- `html { line-height: normal }`: the designs leave line-height at the browser default, while Tailwind sets 1.5.
- Design CSS is content-box, so sizes include borders: 81 px library rows, 22 px badge, 172/134/202 px text boxes.

### Known gaps
- Text renders ≤1 pt lower than the PNGs throughout. This is a DM Sans font-metrics difference (`next/font` build vs the one used to render the designs), not layout. Boxes and positions match.
- Copy link and WhatsApp are `TODO(M4)`. Play/pause and the mini player are static (M3/M6). 05-07 has no entry point in the flow index (gallery only).
- Turbopack sometimes serves stale CSS after editing `app/globals.css`. If a style change doesn't show, restart `pnpm dev` (delete `.next/dev` if needed).

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

