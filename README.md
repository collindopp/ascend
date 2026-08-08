# ASCEND

A premium sales-performance operating system for a virtual setter team — setters track calling activity in seconds; managers get Bloomberg-density analytics on setters, lead lists, and trends.

This is not a generic CRM or a spreadsheet replacement. The product principles are: precision, restraint, speed, and never fabricating a number the data doesn't support.

## Stack

- **Next.js 16** (App Router, Turbopack), TypeScript, React 19
- **PostgreSQL** (Supabase-compatible) via **Prisma 7** with the `@prisma/adapter-pg` driver adapter
- **Auth.js (NextAuth v5)**, credentials + JWT sessions
- **Tailwind CSS v4**, hand-built design system (no admin template)
- **Recharts** for trend visualization
- **Zod** for input validation
- **Vitest** for unit tests

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system design, [DATABASE.md](DATABASE.md) for the schema, [SECURITY.md](SECURITY.md) for the security model, and [ENVIRONMENT.md](ENVIRONMENT.md) for configuration.

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment** — copy `.env.example` to `.env` and fill in `DATABASE_URL` (a Postgres connection string — Supabase free tier works) and `AUTH_SECRET` (generate with `openssl rand -base64 32`). See [ENVIRONMENT.md](ENVIRONMENT.md).

3. **Run migrations**

   ```bash
   npm run db:migrate
   ```

4. **Seed development data** (creates an admin, 2 managers, 6 setters, 5 lead lists, and ~21 days of realistic calling history — all clearly dev-only)

   ```bash
   npm run db:seed
   ```

   Prints the shared dev password for every seeded account (`AscendDemo123!` at time of writing — check the script output).

5. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). You'll land on `/login`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run test` | Run the Vitest unit test suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run db:migrate` | Apply Prisma migrations (dev) |
| `npm run db:generate` | Regenerate the Prisma client (also runs automatically via `postinstall`) |
| `npm run db:seed` | Populate development/demo data |
| `npm run db:studio` | Open Prisma Studio against your database |

## Project structure

```
app/
  (auth)/login/            -- public login
  (setter)/                -- setter role: home, active session, history, personal performance
  (manager)/                -- manager+admin: overview, setters, lead intelligence, matrix, leaderboard, sessions
  (admin)/                  -- admin only: users, teams, lead lists, integrations, audit log, settings
  api/auth/[...nextauth]/   -- NextAuth route handler
lib/
  auth/         -- NextAuth config, session DAL, action-level RBAC guard
  db/           -- Prisma client singleton (driver-adapter based)
  metrics/      -- centralized, null-safe metric calculations + ranking thresholds
  insights/     -- data-driven insight generation (never fabricated)
  aggregation/  -- DailyAggregate rebuild logic
  analytics/    -- manager-facing query layer (overview, setters, lead lists, matrix, leaderboard, sessions)
  admin/        -- admin query + mutation layer
  sessions/     -- setter calling-session query + mutation layer
  integrations/ -- IntegrationProvider interface, registry, stub providers, DB-backed job queue
  validation/   -- Zod schemas
  audit/        -- audit log writer
  rate-limit/   -- in-memory rate limiter
components/
  ui/       -- design system primitives
  setter/   -- setter-flow components
  manager/  -- manager analytics components
  admin/    -- admin CRUD components
prisma/
  schema.prisma, migrations/, seed.ts
tests/  -- Vitest unit tests
```

## Design notes

- Committed dark theme — black/near-black/grayscale + one restrained accent green for positive states. No dashboard-template rainbow, no gradients, no emoji.
- Every metric is computed from raw integers through `lib/metrics/core.ts`; division-by-zero returns `null`, rendered as `—`. Never `NaN%`.
- Rankings and insights respect minimum sample-size thresholds (`lib/metrics/thresholds.ts`) so a lucky small sample can never outrank a large credible one.
- Integrations (Quickbase, Scout Data, 2X Connect) are architected via `lib/integrations/` but intentionally not implemented — the Integrations admin page always reports the real, unconfigured state.
