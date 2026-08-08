# Architecture

## Overview

ASCEND is a single Next.js application (App Router) using React Server Components for reads and Server Actions for writes. There is no separate backend service — the "API layer" is the combination of Server Components (which query Prisma directly, server-side only) and Server Actions (which mutate through the same Prisma client, always behind an authorization check).

```
Browser
  │  navigations / form submits
  ▼
Next.js App Router (Server Components + Server Actions)
  │
  ├─ lib/auth        → session verification, RBAC guards
  ├─ lib/*/queries.ts → read-only Prisma queries, shaped for a specific screen
  ├─ lib/*/actions.ts → "use server" mutations, always requireActionRole() first
  ├─ lib/metrics      → pure calculation functions (no I/O)
  ├─ lib/insights     → pure functions over pre-aggregated data
  └─ lib/integrations → interface + registry + stub providers (no live calls)
  │
  ▼
Prisma (driver adapter: @prisma/adapter-pg)
  │
  ▼
PostgreSQL (Supabase or any Postgres)
```

## Why this shape

**No custom REST/GraphQL API surface.** Server Components fetch data server-side during render; Server Actions handle every mutation. This keeps business logic in one place (`lib/`), removes an entire class of "forgot to protect this endpoint" bugs, and matches Next.js 16's own guidance to prefer Server Actions/Components over hand-rolled API routes and to treat Proxy/Middleware as a last resort. The only real "API route" in the app is the NextAuth handler at `app/api/auth/[...nextauth]/route.ts`, which the library requires.

**Defense in depth on authorization**, per Next.js's own security guidance (see the `authorize` catch: "a Proxy matcher that excludes a path will also skip Server Function calls on that path — always verify authentication and authorization inside each Server Function"):

1. `proxy.ts` — optimistic, JWT-only check (no DB hit). Bounces logged-out users to `/login` and logged-in users away from `/login`. This is a fast path, not a security boundary.
2. Route-group layouts (`app/(setter)/layout.tsx`, `app/(manager)/layout.tsx`, `app/(admin)/layout.tsx`) call `requirePageRole()` — a real DB-backed session check (via `auth()`) that redirects if the role doesn't match. This is the boundary for page access.
3. Every Server Action independently calls `requireActionRole()` before touching the database. A hidden button is never the only protection — see `lib/auth/guard.ts`.
4. Every session/lead-list mutation additionally scopes its Prisma query by the authenticated user's ID (e.g. `where: { id: sessionId, setterId: user.id }`), so even a valid session cannot be mutated cross-user by guessing an ID (IDOR protection).

**Business logic lives in `lib/`, not in page components.** Pages are thin: fetch via a `lib/*/queries.ts` function, render. This is what makes the metrics/insights/threshold logic unit-testable without spinning up Next.js at all (see `tests/`).

## Data flow: a calling session

1. Setter picks a lead list on `/home` → `startSessionAction` (role-checked, checks for an existing active session, then relies on a **partial unique index** — `calling_sessions_one_active_per_setter` — as the hard backstop against a race condition).
2. Each tap (`Dial` / `Conversation` / `Appointment`) calls `recordEventAction`, which in one transaction increments the counter on `CallingSession` and appends a `SessionEvent` row. The event log (not just the counter) is what makes `Undo` correct and gives future time-of-day analytics real data to work with.
3. `Undo` calls `undoLastEventAction`, which looks at the session's own most recent event — never trusts the client's idea of what to undo.
4. `End session` calls `endSessionAction`, which flips `status` to `COMPLETED`, sets `endedAt`, and calls `rebuildAggregateForSession()` to recompute that day's `DailyAggregate` row for (setter, lead list) from the raw `CallingSession` rows. Aggregates are always derived, never authoritative — you could drop the whole `daily_aggregates` table and rebuild it from `calling_sessions`.

## Manager analytics data flow

`lib/analytics/queries.ts` exposes two primitives everything else composes from:

- `fetchSessionsInRange(range)` — raw session rows in a date window, **including in-progress sessions counted as of now** (so "Overview" reflects live activity, not just what's been finalized).
- `groupBy` / `groupByCell` — group those rows by setter, lead list, or (setter, lead list) cell.

Each manager page (`overview`, `setters`, `lead-intelligence`, `matrix`, `leaderboard`, `sessions`) has its own `lib/analytics/*.ts` module that composes these primitives, runs `deriveMetrics()`, and applies the sample-size thresholds from `lib/metrics/thresholds.ts` before anything is allowed to rank or generate an insight.

## Integration architecture (not yet live)

`lib/integrations/types.ts` defines `IntegrationProvider` and `JobQueue` interfaces. `lib/integrations/registry.ts` is the **only** place the app is allowed to reference a concrete provider class — everything else (e.g. the admin Integrations page) goes through `getProvider()` / `getAllProviders()` and only ever sees the interface. The three stub providers (`providers/quickbase.ts`, `providers/scout-data.ts`, `providers/two-x-connect.ts`) report real, honest `NOT_CONNECTED` status and throw `Error("... not implemented yet")` from `connect()`/`sync()` — nothing fakes a live connection. `IntegrationJob` is a plain DB-backed queue table; there's no Redis/BullMQ because nothing enqueues real work yet, but the shape is ready for a worker to slot into later without a data-model change.

## Design system

Dark-only committed theme (tokens in `app/globals.css`, consumed via Tailwind v4's `@theme inline`). Primitives live in `components/ui/`: `Button`, `MetricDisplay` (the large-number-dominant metric primitive used everywhere), `Card`, `Table`, `Badge`, `Modal` (native `<dialog>`), `Toast`, `Select`, `TrendChart` (Recharts, single accent hue), `NavShell`/`NavLinks`, `EmptyState`, `ErrorState`, `Skeleton`. Screens compose these; no screen defines its own one-off button or metric styling.

## Framework-version notes (Next.js 16)

This project was scaffolded on Next.js 16, which has real breaking changes versus older docs/training data:

- `middleware.ts` is renamed `proxy.ts` (same runtime behavior, new file/export name).
- Prisma 7's TypeScript client generator (`provider = "prisma-client"`) requires an explicit **driver adapter** (`@prisma/adapter-pg` here) — `new PrismaClient()` with no adapter throws at runtime.
- The generated Prisma client is TypeScript source, not pre-built JS — it's gitignored and regenerated via `npm run db:generate` (also wired into `postinstall`).
