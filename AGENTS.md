# AGENTS.md — Mozart prototype

You are building a working prototype of **Mozart**, an AI music app. Read this file fully before every task. It tells you what to build, where the truth lives, how to check your own work, and when a task is done.

## 1. What we're building

A mobile-first web app where people make songs from music they already love, share them by link, and friends who open the link make their own version and are asked to sign in to send it back.

**The core loop (the thing the prototype must prove):**
Creator signs in with Spotify → picks Remix / Cover / Rewrite / Something new → generates a track → listens → shares a link → recipient opens the link with no account → listens → makes their own version → taps **Send to Ali** → signs in → lands back on their track with the share sheet open.

If that loop works end to end and looks like the designs, the prototype has succeeded. Music generation is **mocked** (pre-made audio files). Everything else is real.

## 2. Sources of truth (read these, in this order of authority)

| File | What it is | Authority |
| --- | --- | --- |
| `docs/designs/png/*.png` | 39 screens, 390 × 844 pt rendered at 3× | **UI and experience: highest.** If anything disagrees with a design, the design wins |
| `docs/designs/html/*.dc.html` | Source of each screen: exact colours, sizes, spacing, radii, copy | Use for exact values. Not runnable as-is (needs a canvas runtime). Never import these into the app |
| `docs/flow-index.md` | Every screen in order, what each tap does and where it goes | Navigation and behaviour |
| `docs/tech-spec.md` | Architecture, data model, API, flows | Technical approach |
| `docs/product.md` | Requirements, journeys, scope | Product intent and out of scope |

**Path note:** `docs/flow-index.md` refers to images as `1-main-flow/png/…` and sources as `1-main-flow/html-source/…`. They live at `docs/designs/png/…` and `docs/designs/html/…`. File names are identical.

**Screen IDs:** each design is named `RR-CC_title.png` (row-column). Refer to screens by this ID in commits, PRs and progress notes, e.g. "03-05 Player · creator".

## 3. Decisions already made (do not re-open these)

- **Stack:** this repo — Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 (CSS-first: tokens in `app/globals.css` via `@theme`, no `tailwind.config`), pnpm. Deploy target: Vercel.
- **Next.js 16 may differ from your training data.** Before using routing, caching, `cookies()`, `headers()`, route handlers, metadata or server actions, check the installed docs in `node_modules/next/dist/docs/` (if present) or the types in `node_modules/next`. Don't guess APIs.
- **Database:** Postgres (Supabase), accessed **only from server code** (route handlers / server components) through Drizzle ORM. The browser never talks to the database and never sees a key.
- **Two tables only:** `users` and `tracks`, as in `docs/tech-spec.md` §4. Song lists, genres, singers, themes and the mock audio catalogue are static TypeScript config, not tables.
- **Routes:** `/`, `/create`, `/create/remix|cover|rewrite` (step 1) and their step 2, `/create/new` (Something new), `/track/[slug]` (the one universal player), `/track/[slug]/remix|cover|rewrite|vibe` (step 2 from a player, track pre-picked), `/library`, `/auth/spotify/login`, `/auth/spotify/callback`, `/auth/dummy`.
- **Modes:** `remix | cover | rewrite | vibe | new`. `new` = "Something new" on the Create home: made from scratch from free text, no source track. `vibe` = the fourth button on a player: starts from that track, free-text change. Remix / Cover / Rewrite are the structured modes.
- **Track naming rule:** `{original song title} × {change}` — e.g. *Cruel Summer × Bollywood*, *In Too Deep × Arijit Singh*, *Payphone × Moving to London*. Always use the **root** original song, even down a chain (a remix of *Cruel Summer × Bollywood* is *Cruel Summer × Electronic*, never a double ×). Artist shown under the title = the maker's first name; "You" for an anonymous maker.
- **Anonymous recipients:** a `mozart_anon` cookie (random UUID, httpOnly, 1 year). They can listen and make **one** track from a shared track. Saving, sharing or a second make opens the **Send to Ali** sheet.
- **Claiming:** on sign-in, tracks with the visitor's `anonymous_session_id` get `owner_user_id` set, then redirect back to that track with the share sheet open and a "Signed in · saved to your library" toast.
- **Auth:** Spotify Authorization Code + PKCE, scopes `user-read-private user-top-read`. Spotify Development Mode only allows 5 allowlisted users, so **any Spotify failure (cancel, 403, 429, timeout) silently falls back to the dummy user**, landing exactly where a real sign-in would. The landing page's "Log in" button is the dummy login. Don't store Spotify tokens; fetch taste once at sign-in.
- **Local address:** run and test the app at `http://127.0.0.1:3000`, never `localhost` (Spotify rejects `localhost` redirect URIs, and cookies don't carry between the two). Spotify redirect URI = `{APP_URL}/auth/spotify/callback`. Real Spotify response shapes are in `docs/fixtures/spotify/`.
- **Mock generation:** one server function maps a request to a file in `public/audio/` (see `docs/tech-spec.md` §6), creates the track row, returns it. The UI shows that mode's Generating screen for ~3–4 s, then opens the player.
- **Audio:** one global `<audio>` element in an `AudioProvider` at the app root, so playback survives navigation and drives the mini player. Never autoplay a shared link.
- **Out of scope:** real AI generation, native apps, feeds, follows, likes, comments, notifications, payments, contact import, playlists, search beyond the song picker.

If you hit a genuine ambiguity not covered here, pick the option closest to the designs, write the assumption in `docs/progress.md`, and carry on. Only stop to ask for things you cannot invent: credentials, secrets, or a choice that would be expensive to undo.

## 4. Design system

Match the PNGs pixel-close at a 390 px wide viewport. On wider screens, centre a 390 px column on the `#121212` background.

| Token | Value |
| --- | --- |
| Background / surface / raised | `#121212` / `#202020` / `#2e2e2e` |
| Borders | `#474747`, `#5e5e5e` |
| Text / secondary | `#d9d9d9` / `#bababa` |
| Accent (play, saved ✓, primary buttons, Copy link) | `#f2f2f2` with `#121212` text |
| Remix | `#ff754c` (orange) |
| Cover | `#a259ff` (purple) |
| Rewrite | `#2ec4b6` (teal) |
| Vibe / Something new | `#ffc93c` (yellow) |
| Text on any mode colour | `#121212` |
| Font | DM Sans 400 / 500 / 600 / 700 (`next/font/google`) |

Rules the designs follow — keep them:
- Mode colour appears only on creative things: mode cards, mode tiles, the tinted pill back button, selected pills, the "…but make it **X**" word, Generate buttons, Generating screens.
- Everything else uses the off-white accent or greys.
- Tap targets ≥ 44 px. Icons are stroke icons; copy the SVG paths from `docs/designs/html/` rather than redrawing.
- Album art is a grey placeholder square with initials — keep it that way.

## 5. How to work (every task)

1. **Start clean** — follow §6 to get onto a fresh branch from an up-to-date `main`.
2. **Read** this file, `docs/progress.md`, and the docs and screens the task names. Open the PNGs you're building against — look at them, don't guess from file names.
3. **Don't write a plan.** Once you understand the task, implement it in a logical order, one working step at a time, building after each step and committing it (§6). **Build in small steps.** Get something rendering, then refine. Prefer shared components over copies (one `Player` for all player screens, one step-2 component for create-flow and from-player).
4. **Verify — all of these, every time:**
   - `pnpm tsc --noEmit` and `pnpm lint` pass with no errors.
   - `pnpm build` succeeds.
   - **Look at your output.** Run the app and capture each screen you touched at 390 × 844 with Playwright (`pnpm shots`, set up in milestone 1, saves to `.shots/`). Open your screenshot and the matching `docs/designs/png/` file and compare: layout, spacing, sizes, colours, copy, icons. List the differences, fix them, re-capture. Repeat until a careful reviewer would call them the same screen.
   - **Click through the behaviour** described for those screens in `docs/flow-index.md`; every tap goes where it says.
   - Run the end-to-end tests that exist (`pnpm test:e2e`) and add to them for anything you built that's on the core loop.
5. **Record** in `docs/progress.md`: what's done (screen IDs), what's verified and how, assumptions made, known gaps. Keep it short and current — it's how the next session picks up.
6. **Push and open a pull request** for me to test (§6). Then stop: I test and merge.

A task is **done** only when every check in step 4 passes, progress is recorded, and the branch is pushed with a PR open. Never claim a screen matches the design without having looked at both images.

## 6. Git and GitHub

`main` always works. I test every change on its branch before it reaches `main`, and **I merge, never you.**

- **One branch per milestone (or fix), from the latest `main`:** `git switch main && git pull`, then `git switch -c m3-generate` (format `m<number>-<short-name>`; fixes: `fix/<short-name>`). Start only from a clean working tree; if `git status` isn't clean, stop and tell me what's there.
- **Commit after each working step**, not one big commit at the end. Every commit builds. Message: `M3: <what changed> (<screen IDs>)`, e.g. `M3: Generating screens 03-01..03-04`.
- **Push the branch** after the first commit (`git push -u origin <branch>`) and after every commit that follows, so the Vercel preview stays current.
- **Open a draft pull request** with `gh pr create --draft --base main` once the first commit is pushed. When the milestone is done, update its description and mark it ready (`gh pr ready`). The description has:
  - **What's in it** — screens by ID, routes, API endpoints.
  - **How to test** — setup commands (e.g. `pnpm db:migrate`), then a numbered click path I can follow on the Vercel preview or locally, with what I should see at each step.
  - **Checks run** — typecheck, lint, build, e2e results; which screens were compared with the designs.
  - **Known gaps / assumptions.**
- **Feedback:** fix on the same branch with new commits and push. Don't open a new PR.
- **Never:** push to or commit on `main`; merge a PR; force-push or rewrite pushed history (`--force`, `rebase` of pushed commits, `reset --hard` on shared work); delete branches; commit `.env*.local`, secrets, `.shots/`, or anyone's personal data.
- **Migrations:** commit the generated migration files with the schema change. Never edit a migration that has already run; add a new one.
- **Worktrees:** only if I ask for two agents to work at the same time. Then each works in its own worktree (`git worktree add ../mozart-<branch> -b <branch> main`) on its own branch, with its own dev-server port.
- If there's no `origin` remote or `gh` isn't signed in, stop and ask me; don't create repos or change remotes yourself.

## 7. Code conventions

- Server-only code (DB, Spotify, secrets) in `lib/server/` and imported only from route handlers and server components; mark files with `import 'server-only'`.
- Secrets only in env vars (`DATABASE_URL`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SESSION_SECRET`, `APP_URL`). **Never** prefix a secret with `NEXT_PUBLIC_`. Keep `.env.example` up to date.
- Sessions: signed, httpOnly, `Secure`, `SameSite=Lax` cookies. Validate any `returnTo` is a same-site path.
- Static config in `lib/config/` (songs, genres, singers, themes, idea templates, mock audio catalogue).
- Components in `components/` grouped as in `docs/tech-spec.md` §17.
- No new dependencies unless they clearly save time; say why in the commit. Expected: `drizzle-orm`, `postgres`, `drizzle-kit`, `nanoid`, `iron-session` (or equivalent), `@playwright/test`.
- TypeScript strict. No `any` in shared types.

## 8. Milestones (you'll be given one at a time)

1. **Foundations** — tokens, fonts, app shell, DB schema + migrations + seed, dummy login, `pnpm shots` + Playwright set up, `docs/progress.md` created.
2. **Static UI** — every screen built from the designs with fixture data; navigation per the flow index.
3. **Generate** — `POST /api/generate`, mock audio, Generating screens, player with real audio, auto-save.
4. **Share** — `/track/[slug]` server-rendered with Open Graph tags, share sheet, Copy link, WhatsApp.
5. **Recipient loop** — anonymous cookie, recipient player, make-from-track, one-make limit, Send to Ali sheet, claim on sign-in, return with share sheet open + toast.
6. **Library + mini player** — library list, minimise player, playback across Create and Library.
7. **Spotify** — real sign-in, taste import into song pickers and Something new ideas, silent fallback.
8. **Polish + E2E** — the full core-loop Playwright test green, WhatsApp preview check, visual pass over all 39 screens.

Don't start a later milestone's work early unless the current one needs it.
