# API

ASCEND doesn't expose a conventional REST/GraphQL API. Reads happen inside React Server Components (direct Prisma queries, server-side only); writes happen through Next.js Server Actions. This document is a map of those instead of an endpoint list.

## The one real HTTP route

`app/api/auth/[...nextauth]/route.ts` — re-exports NextAuth's `GET`/`POST` handlers. Handles the credentials sign-in callback, session/CSRF endpoints, etc. under `/api/auth/*`. You should not need to call this directly; use the `signIn`/`signOut` helpers from `lib/auth`.

## Server Actions (the real mutation surface)

All are plain async functions marked `"use server"`, callable directly from Client Components. Each independently authorizes via `requireActionRole()` and validates input with Zod before touching the database. Each returns `{ ok: true, data } | { ok: false, error: string }` — never throws for expected failure modes.

### `lib/auth/actions.ts`
- `loginAction(prevState, formData)` — credentials sign-in, rate-limited, writes a `LOGIN` audit entry.
- `logout()` — signs out and redirects to `/login`.

### `lib/sessions/actions.ts` (role: `SETTER`)
- `startSessionAction({ leadListId })` — starts a calling session; fails if one is already active or the DB partial-unique-index race backstop trips.
- `recordEventAction({ sessionId, type })` — records one `DIAL`/`CONVERSATION`/`APPOINTMENT` tap; returns authoritative updated counts.
- `undoLastEventAction({ sessionId })` — undoes the session's own most recent event (server-determined, never client-specified).
- `endSessionAction({ sessionId })` — completes the session and rebuilds its `DailyAggregate` bucket.

### `lib/admin/actions.ts` (role: `ADMIN`, some `MANAGER`)
- `createUserAction(...)` / `updateUserAction(...)` — `ADMIN` only. Rate-limited. A user cannot deactivate themselves or demote their own role away from admin.
- `createTeamAction(...)` — `ADMIN` only.
- `createLeadListAction(...)` / `updateLeadListStatusAction(...)` — `ADMIN` or `MANAGER`.
- `upsertSystemSettingAction(...)` — `ADMIN` only.

Every action above writes an `AuditLog` entry on success (see `SECURITY.md`).

## Query layer (reads)

Organized by domain, each file exports plain async functions returning shaped data for a specific screen — not a generic "get everything" query:

- `lib/lead-lists/queries.ts` — lead lists with historical stats for the setter's selection screen.
- `lib/sessions/queries.ts` / `lib/sessions/performance.ts` — a setter's own sessions/history/personal performance.
- `lib/analytics/*.ts` — manager-facing: `overview.ts`, `setters.ts`, `lead-lists.ts`, `matrix.ts`, `leaderboard.ts`, `sessions-explorer.ts`, `insights.ts`.
- `lib/admin/queries.ts` — admin screens: users, teams, lead lists, audit log, settings, integration statuses.

## Metrics engine (pure functions, no I/O)

`lib/metrics/core.ts` — the single source of truth for every derived number in the app:

```ts
conversionRate(conversations, dials): number | null
setRateFromConversations(appointments, conversations): number | null
setRateFromDials(appointments, dials): number | null
dialsPerAppointment(dials, appointments): number | null
conversationsPerAppointment(conversations, appointments): number | null
perHour(count, durationSeconds): number | null
deriveMetrics(totals: RawTotals): DerivedMetrics   // computes all of the above at once
sumTotals(rows: RawTotals[]): RawTotals
```

Every function returns `null` on division-by-zero or invalid input — callers render that as `—` via `lib/format/number.ts`, never `NaN%`/`Infinity`.

`lib/metrics/thresholds.ts` gates ranking/insights on minimum sample size (`meetsSetRateThreshold`, `meetsConversionRateThreshold`, `meetsHourlyRankingThreshold`).

`lib/insights/index.ts` composes the above into human-readable insight strings — every generator returns `null`/`[]` when the data doesn't clear its threshold, never a fabricated statement.

All of the above are unit tested in `tests/` without any Next.js or database dependency.
