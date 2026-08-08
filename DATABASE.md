# Database

PostgreSQL, managed with Prisma migrations. Schema source of truth: `prisma/schema.prisma`. Applied migrations: `prisma/migrations/`.

## Entities

| Table | Purpose |
|---|---|
| `teams` | Groups users. Currently one team in seed data; the model supports many. |
| `users` | Setters, managers, admins. `role` is one of `ADMIN` / `MANAGER` / `SETTER`. `passwordHash` is bcrypt, never returned from any query used by a page (see the DTO note below). |
| `lead_lists` | A callable list: name, source, location, description, status (`ACTIVE`/`ARCHIVED`), lead count, external ID, tags. |
| `calling_sessions` | The fundamental unit of activity. One setter, one lead list, a time span, and raw counters (`dials`, `conversations`, `appointments`). |
| `session_events` | Append-only log of individual taps (`DIAL`/`CONVERSATION`/`APPOINTMENT`/`UNDO`) with a timestamp. Powers `Undo` and future time-of-day analytics. Not backfilled for seeded historical sessions (see `prisma/seed.ts` header comment). |
| `daily_aggregates` | Derived rollup, unique per (date, setter, lead list). Rebuilt from `calling_sessions` whenever a session ends — never hand-edited, never the source of truth. |
| `audit_logs` | Append-only record of sensitive actions (login, session start/end, user/lead-list/setting changes). `metadata` is a JSON blob that must never contain secrets. |
| `integration_configs` | One row per external provider (`QUICKBASE`/`SCOUT_DATA`/`TWO_X_CONNECT`) tracking connection status. No credentials live here — those are env vars only. |
| `integration_jobs` | A simple queue table for future sync jobs (import/export/sync), with status/attempts/lastError. Nothing enqueues real jobs yet. |
| `system_settings` | Generic key/value store for admin-configurable values. |

## Constraints enforced at the database level

Prisma's schema language can't express everything, so the initial migration (`prisma/migrations/20260808181149_init/migration.sql`) was hand-edited after generation to add:

- `CHECK` constraints so `dials`, `conversations`, `appointments`, `leadCount`, `sessionsCount`, `durationSeconds`, and `attempts` can never go negative.
- `CHECK (endedAt IS NULL OR endedAt >= startedAt)` on `calling_sessions` — no impossible timestamps.
- **`calling_sessions_one_active_per_setter`** — a partial unique index on `calling_sessions(setterId) WHERE status = 'ACTIVE'`. This is the hard backstop behind the application-level check in `startSessionAction`; even a race condition can't create two active sessions for the same setter.

If you regenerate a migration with `prisma migrate dev`, remember these hand-written additions aren't derivable from `schema.prisma` alone — re-add them (or keep them in a follow-up migration) if you ever reset migration history.

## Foreign keys

- `calling_sessions.setterId → users.id`, `calling_sessions.leadListId → lead_lists.id` (both `RESTRICT` on delete — you can't delete a user or lead list with session history).
- `session_events.sessionId → calling_sessions.id` (`CASCADE` — events die with their session).
- `daily_aggregates.setterId` / `.leadListId` (`RESTRICT`).
- `lead_lists.createdById → users.id` (`SET NULL` — a lead list survives its creator being removed).
- `audit_logs.actorId → users.id` (`SET NULL` — logs survive user deletion; `actorId` is nullable for system-originated events).
- `integration_jobs.provider → integration_configs.provider`.

## Data Transfer Object discipline

Every query that could plausibly be reused near a client boundary explicitly `select`s fields rather than relying on the default (which would include `passwordHash`). See `lib/admin/queries.ts:getUsersForAdmin`, `lib/analytics/setters.ts:getSetterDetail`, `lib/analytics/matrix.ts`, `lib/auth/actions.ts`, `lib/admin/actions.ts`. The only place `passwordHash` is legitimately read is `lib/auth/config.ts`'s `authorize()` callback, for the bcrypt comparison — it is never included in what that callback returns to NextAuth.

## Aggregation strategy

Raw session data (`calling_sessions`, `session_events`) is never deleted or overwritten by aggregation. `daily_aggregates` is rebuilt (upserted) per (date, setter, lead list) whenever a session in that bucket ends — see `lib/aggregation/daily.ts:rebuildDailyAggregate`. This means aggregates can always be regenerated from scratch by re-running that function over every `calling_sessions` row, which is the safety property section 47 of the spec asks for.

The manager "Overview" page deliberately does **not** read from `daily_aggregates` — it reads raw `calling_sessions` directly (including in-progress ones) so "how is my team performing right now" reflects live activity, not just what's been finalized. Deeper analytics pages (setter/lead-list trend charts) read `daily_aggregates` for a fixed 30-day window, which is cheaper and accurate for anything that isn't "this instant."

## Seed data

`prisma/seed.ts` is destructive-but-scoped: it deletes and regenerates `calling_sessions`/`daily_aggregates` **only for the setter accounts it creates**, so it's safe to re-run repeatedly in development. It is explicitly documented as dev/demo-only and must never be run against a database containing real user data.
