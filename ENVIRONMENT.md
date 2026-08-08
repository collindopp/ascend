# Environment variables

Copy `.env.example` to `.env` and fill in real values. `.env` is gitignored — never commit it.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string. Works with Supabase (free tier), Neon, RDS, or local Postgres — the schema uses no Supabase-specific features. For Supabase: **Project Settings → Database → Connection string**. |
| `AUTH_SECRET` | Yes | Signs the session JWT. Generate with `openssl rand -base64 32`. Use a different value per environment; never reuse the development secret in production. |
| `QUICKBASE_CLIENT_ID` | No (unused) | Reserved for the future Quickbase integration. Leave blank — nothing reads it yet. |
| `QUICKBASE_CLIENT_SECRET` | No (unused) | Same. |
| `SCOUT_DATA_API_KEY` | No (unused) | Reserved for the future Scout Data integration. |
| `TWO_X_CONNECT_API_KEY` | No (unused) | Reserved for the future 2X Connect integration. |

## Local development

```bash
cp .env.example .env
# edit .env: paste your DATABASE_URL, generate AUTH_SECRET
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Cost

Every dependency here is free/open-source and every external service used in this build (Supabase Postgres) has a free tier well above what this app's data volume needs. Nothing requires a credit card to run locally. The unused integration variables cost nothing sitting blank — they'll only matter once Quickbase/Scout Data/2X Connect are actually implemented, which is out of scope for this build.

## Production

- Set `DATABASE_URL` and `AUTH_SECRET` as real secrets in your hosting platform's environment configuration (Vercel project settings, a `.env` mounted by your container platform, etc.) — never in a committed file.
- Generate a fresh `AUTH_SECRET` for production; don't reuse the one from `.env.example` or local development.
- If you deploy behind a load balancer / multiple instances, see the rate-limiting note in `SECURITY.md` — the current limiter is single-instance/in-memory.
