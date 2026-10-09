# Mozart

**Production:** https://mozart-iota.vercel.app

Mozart v1 is a mobile-first web prototype for making songs from music you already love, sharing them by link, and getting friends to make their own version.

1. **Make a track.** Sign in with Spotify (or "Log in" as a demo user), pick Remix / Cover / Rewrite / Something new, and generate a track.
2. **Share it.** Copy the link or send it on WhatsApp.
3. **A friend makes one back.** They open the link without an account, listen, and make **one** version of their own. "Send to Ali" asks them to sign in, which saves their track to their library and opens the share sheet.

Generation is **mocked**: each request maps to one of 8 pre-made MP3s in `public/audio/`. Everything else is real: Postgres, sessions, Spotify sign-in and taste import, share links with previews, anonymous makes and claiming.

See `AGENTS.md` for the rules and design system, and `docs/handover.md` for how it works, its decisions and the known gaps.

## Run it locally

```bash
cp .env.example .env.local   # then fill in the variables below
pnpm i
pnpm db:migrate              # create the two tables (users, tracks)
pnpm db:seed                 # Ali, Sam and Ali's 6 library tracks (idempotent)
pnpm dev                     # http://127.0.0.1:3000 — never localhost
```

Use `127.0.0.1`, not `localhost`: Spotify rejects `localhost` redirect URIs, and cookies don't carry between the two.

## Environment variables

All server-only; none is `NEXT_PUBLIC_`. `.env.example` has the details.

| Variable | Required | What it is |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Supabase Postgres, transaction pooler URL (port 6543) |
| `SESSION_SECRET` | Yes | 32+ random characters (`openssl rand -base64 32`) |
| `APP_URL` | Production | The public origin for share links, previews and the Spotify redirect. Locally `http://127.0.0.1:3000`. On Vercel set it for **Production only**; previews use `https://$VERCEL_URL` |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | No | Real Spotify sign-in. Without them (and on previews), "Connect Spotify" silently signs in a demo user |
| `DATABASE_URL_MIGRATE` | No | Direct URL (port 5432) for `pnpm db:migrate` if the pooler hangs |

In the Spotify dashboard, register `http://127.0.0.1:3000/auth/spotify/callback` and `https://mozart-iota.vercel.app/auth/spotify/callback`. Development Mode allows 5 allowlisted users; anyone else (or any Spotify failure) silently becomes a demo user.

## Test it

| Command | What it does |
| --- | --- |
| `pnpm typecheck` / `pnpm lint` / `pnpm build` | Static checks and a production build |
| `pnpm test:unit` | Unit tests (Node test runner) |
| `pnpm test:e2e` | Playwright end-to-end tests. Runs its own app on port 3001 against a fake Spotify on 4545, so it never touches the real one. Tests delete every track they create |
| `pnpm shots [id]` / `pnpm shots:diff [id]` | Capture screens at 390 × 844 and diff them with `docs/designs/png/` |

The dev gallery at `/dev/screens` shows all 39 designed screens; `/dev/compare/{id}` puts one beside its design. Neither is available in production.

## Deploy

Vercel builds every push; previews sit behind Vercel's login. Set `DATABASE_URL`, `SESSION_SECRET` and the Spotify credentials for Production and Preview, and `APP_URL` for Production only. Migrations don't run during the build: run `pnpm db:migrate` against the database yourself when the schema changes.
