# Contributing

## Setup

See the "Getting started" section of `README.md`.

## Before opening a change

```bash
npm run lint
npx tsc --noEmit
npm run test
```

All three should be clean. There's no CI pipeline wired up yet in this repo — these are manual gates for now.

## Conventions

- **Business logic goes in `lib/`, not in page components.** A page should be: fetch via a `lib/*/queries.ts` function, render. See `ARCHITECTURE.md`.
- **Every metric is computed through `lib/metrics/core.ts`.** Never write `appointments / conversations * 100` inline on a page — add or reuse a function there, so division-by-zero handling stays consistent everywhere.
- **Every Server Action starts with `requireActionRole([...])`** and validates its input with a Zod schema from `lib/validation/`. Scope every mutation's `where` clause by the authenticated user where relevant (IDOR protection) — don't rely on the role check alone.
- **New route groups need a `layout.tsx` that calls `requirePageRole([...])`.** `proxy.ts` is an optimistic fast-path, not a security boundary — see `SECURITY.md`.
- **Don't fabricate data.** If a ranking or insight doesn't clear its sample-size threshold (`lib/metrics/thresholds.ts`), it must not render — show nothing or `—`, not a number the sample can't support.
- **Design tokens, not magic values.** Colors/radii/durations come from the CSS custom properties in `app/globals.css` (`var(--accent)`, `var(--radius-md)`, etc.) or their Tailwind utility equivalents (`bg-surface-1`, `text-text-secondary`, ...) — don't hardcode a hex color in a component.
- **Reuse `components/ui/` primitives.** If you need a new visual pattern more than once, add it there rather than duplicating markup across pages.

## Database changes

1. Edit `prisma/schema.prisma`.
2. `npx prisma migrate dev --name <description> --create-only` to generate SQL without applying it.
3. If you need a `CHECK` constraint, partial index, or anything else Prisma's schema language can't express, hand-edit the generated `migration.sql` before applying (see the existing migration for the pattern) — Prisma won't regenerate these for you on `db push`/future migrations, so note them in `DATABASE.md` too.
4. `npm run db:migrate` to apply.
5. `npm run db:generate` if you need the client regenerated without a new migration (also runs automatically on `npm install` via `postinstall`).

## Tests

Unit tests live in `tests/` and run against pure functions only (`lib/metrics`, `lib/insights`, `lib/utils/date-range`, `lib/rate-limit`, `lib/format`, `lib/validation`) — no database, no Next.js runtime. There is currently no integration-test setup against a real/test Postgres database; if you add one, document the setup here and in `DATABASE.md`.

## Seed data

`prisma/seed.ts` is safe to re-run — it upserts users/teams/lead-lists by fixed identifiers and only deletes/regenerates `calling_sessions`/`daily_aggregates` for the setter accounts it itself creates. Never point it at a database with real user data.
