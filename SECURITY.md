# Security

## Secrets

- All secrets are environment variables, loaded from `.env` (gitignored) — see `ENVIRONMENT.md`. `.env.example` documents every variable with placeholder values only.
- Nothing in `lib/`, `app/`, or `components/` contains a hardcoded credential. Verified by grepping for key/secret/password/token patterns and for `console.*` calls that might log them — see the audit note at the bottom of this file.
- The Prisma client connects via a driver adapter (`@prisma/adapter-pg`) constructed from `process.env.DATABASE_URL`; the connection string never appears in client-bundled code (it's only referenced in `lib/db/client.ts` and `prisma/seed.ts`, both server-only).
- Future integration credentials (`QUICKBASE_CLIENT_ID`/`SECRET`, `SCOUT_DATA_API_KEY`, `TWO_X_CONNECT_API_KEY`) are reserved in `.env.example` but unused — nothing reads them yet because nothing calls those APIs yet.

## Authentication

- Auth.js (NextAuth v5), Credentials provider, JWT session strategy.
- Passwords hashed with bcrypt (`bcryptjs`, cost factor 12) — see `lib/auth/config.ts` and `lib/admin/actions.ts`. Plaintext passwords are never stored or logged.
- `AUTH_SECRET` signs the session JWT; generate a fresh one per environment (`openssl rand -base64 32`), never reuse the development value in production.

## Authorization (defense in depth)

Three independent layers — see `ARCHITECTURE.md` for the full data-flow diagram:

1. `proxy.ts` — optimistic redirect for logged-out users. **Not** a security boundary by itself (Next.js's own guidance: a Proxy matcher change can silently stop covering a Server Action route).
2. `requirePageRole()` in each route group's `layout.tsx` — a real, DB-backed session check.
3. `requireActionRole()` in **every** Server Action, independent of what the UI shows. A setter cannot mutate another setter's session even with a hand-crafted request, because every mutation additionally filters its Prisma query by `setterId: user.id` (or the admin equivalent).

Role model: `SETTER` → only their own setter routes/data. `MANAGER` → manager analytics routes. `ADMIN` → admin routes **and** manager routes (a deliberate superset, since an admin who can manage users/lead lists/integrations should reasonably be able to see team performance too — see `app/(manager)/layout.tsx`).

## Input validation

Every Server Action validates its input with a Zod schema (`lib/validation/*.ts`) before touching the database — including a `recordEventAction` test case confirming an arbitrary client-supplied event type (e.g. `"UNDO"` or garbage) is rejected, since the client is never trusted to say what happened; the server derives "what to undo" from its own event log instead.

## Database security

- 100% Prisma queries — no raw SQL string interpolation anywhere in application code (the one hand-written SQL is the migration file itself, which is static DDL, not a runtime query).
- IDOR protection: every session/session-event mutation scopes by the authenticated user's ID at the query level, not just an application-level "is this allowed" check.
- Non-negative and valid-timestamp `CHECK` constraints at the DB level (see `DATABASE.md`) — a bug in application code can't produce negative counters or backwards time spans even if it tried.
- Least-privilege note: the seed script and app both connect with whatever role your `DATABASE_URL` grants. For production, create a dedicated Postgres role scoped to the `ascend` schema rather than using the Supabase project's default `postgres` superuser.

## Rate limiting

An in-memory token-bucket limiter (`lib/rate-limit/memory.ts`) is applied to:

- Login (`loginAction`) — 5 attempts / 60s per (IP, email).
- Session creation (`startSessionAction`) — 10 / 60s per setter.
- Admin user creation (`createUserAction`) — 20 / 60s per admin.

**Known limitation**: this is single-instance/in-memory. If ASCEND is ever deployed across multiple server instances (serverless functions, multiple containers), each instance has its own counter and the effective limit multiplies by instance count. For a multi-instance deployment, replace `lib/rate-limit/memory.ts`'s backing store with a shared one (Redis, Upstash, or a DB-backed counter) behind the same `checkRateLimit()` interface.

## Error handling

- `app/error.tsx` and `app/global-error.tsx` render a calm, generic message and never surface `error.message` from a server-originated error to the user — Next.js itself redacts Server Component/Action error details in production builds, exposing only an opaque `digest` you can correlate with server logs.
- Server Actions return typed `{ ok: false, error: string }` results for expected failure modes (bad input, not found, unauthorized, already-active session) with hand-written, non-technical messages — never a raw Prisma/driver error string.

## Frontend security

- No `dangerouslySetInnerHTML` anywhere in the codebase (grepped as part of this security pass).
- Security headers set in `next.config.ts`: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `Strict-Transport-Security` (production only). The CSP is intentionally stricter in production than in development (dev needs `'unsafe-eval'` and a `ws:` connection for Turbopack's HMR client) — see the comment in `next.config.ts`.
- CSRF: Next.js Server Actions include built-in Origin-header verification; no custom CSRF token handling was needed.

## Audit logging

`lib/audit/log.ts:writeAuditLog()` is called from every sensitive mutation: login, session start/end, user create/update, team create, lead-list create/status-change, system-setting change. Failures to write an audit entry are caught and logged server-side but never block the primary action — an audit-log outage must not take down calling. `metadata` passed to audit entries is always a small, non-secret JSON object (e.g. `{ role: "MANAGER" }`, never a password or token).

## What's intentionally out of scope for this pass

- Multi-factor authentication, password reset via email (no email provider configured), and session device management — not requested by the spec's MVP scope.
- A dedicated least-privilege Postgres role for the app (see the database security note above) — depends on your hosting choice.
- Automated dependency vulnerability scanning (`npm audit` / Dependabot) — recommended as a CI step once this repo has a CI pipeline.
