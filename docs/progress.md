# Progress

## Milestone 1 — Foundations · done (PR #1, branch `m1-foundations`)

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

## Next: Milestone 2 — Static UI
