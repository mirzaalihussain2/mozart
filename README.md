# Mozart prototype

A mobile-first web app for making songs from music you already love, sharing them by link, and letting friends make their own version. See `AGENTS.md` for how the project works and `docs/handover.md` for where it is.

## Run it locally

```bash
cp .env.example .env.local   # then fill in DATABASE_URL and SESSION_SECRET
pnpm i
pnpm db:migrate
pnpm db:seed
pnpm dev                     # http://127.0.0.1:3000 (never localhost)
```

| Command | What it does |
| --- | --- |
| `pnpm typecheck` / `pnpm lint` / `pnpm build` | Checks |
| `pnpm test:unit` | Unit tests (Node test runner) |
| `pnpm test:e2e` | Playwright end-to-end tests (starts `pnpm dev` if needed) |
| `pnpm shots [id]` / `pnpm shots:diff [id]` | Capture screens at 390 × 844 and compare with `docs/designs/png/` |

The dev gallery at `/dev/screens` shows all 39 designed screens (not available in production).

## Deploying to Vercel

Set these in **Project → Settings → Environment Variables**:

| Variable | Production | Preview | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | ✓ | ✓ | Supabase transaction pooler URL (port 6543) |
| `SESSION_SECRET` | ✓ | ✓ | 32+ random characters |
| `APP_URL` | ✓ | — | Your production domain, e.g. `https://mozart.example.com`. Leave **unset** for Preview: previews use `https://$VERCEL_URL` |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | ✓ | ✓ | Real Spotify sign-in (previews always use the dummy fallback) |

In the **Spotify dashboard**, register the redirect URIs `http://127.0.0.1:3000/auth/spotify/callback` and `{production APP_URL}/auth/spotify/callback`. Development Mode allows 5 allowlisted users; everyone else silently becomes a dummy persona.

`pnpm test:e2e` runs its own app on port 3001 (`.next-e2e`) against a fake Spotify on 4545, so it never touches the real one.

Migrations don't run during the build: run `pnpm db:migrate` against the database yourself when the schema changes.
