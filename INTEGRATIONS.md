# Integrations

**Status: architecture only. Nothing below makes a live external API call.** The admin Integrations page (`/admin/integrations`) always reports the real, unconfigured state (`NOT CONNECTED`) for all three providers — see `lib/admin/queries.ts:getIntegrationStatuses()`, which goes through the provider registry and never hardcodes a status.

## Why build the architecture without the integrations

The ASCEND spec is explicit: prepare clean adapter interfaces for Quickbase, Scout Data, and 2X Connect, but do not implement them yet. The goal is that adding a real integration later is a matter of filling in one provider class, not restructuring the app.

## The interface

`lib/integrations/types.ts` defines what every provider must implement:

```ts
interface IntegrationProvider {
  readonly name: IntegrationProviderName;
  isConfigured(): boolean;                          // do the required env vars exist?
  getStatus(): Promise<IntegrationStatus>;           // real status, from the DB
  connect(): Promise<void>;                          // throws "not implemented yet"
  sync(jobType: IntegrationJobType): Promise<void>;   // throws "not implemented yet"
}
```

The core application depends **only** on this interface. `lib/integrations/registry.ts` is the single place allowed to import a concrete provider class:

```ts
const registry: Record<IntegrationProviderName, IntegrationProvider> = {
  QUICKBASE: new QuickbaseProvider(),
  SCOUT_DATA: new ScoutDataProvider(),
  TWO_X_CONNECT: new TwoXConnectProvider(),
};
```

Everything else calls `getProvider(name)` or `getAllProviders()` and codes against `IntegrationProvider` — dependency inversion, so the app works identically with zero integrations wired up (and does today).

## Per-provider future scope (from the spec)

| Provider | Future use | Env vars (reserved, unused) |
|---|---|---|
| **Quickbase** | Push performance data, pull lead information, sync appointment outcomes, possibly sync users. | `QUICKBASE_CLIENT_ID`, `QUICKBASE_CLIENT_SECRET` |
| **Scout Data** | Import lead lists, identify lead-source metadata, track list IDs, potentially sync lead counts. | `SCOUT_DATA_API_KEY` |
| **2X Connect** | Dial volume, call outcomes, conversation data, potentially automate metric collection. | `TWO_X_CONNECT_API_KEY` |

GoHighLevel is explicitly out of scope per the spec and has no stub.

## Job queue (also not live)

`lib/integrations/job-queue.ts` provides a minimal DB-backed queue against the `integration_jobs` table — `enqueue` / `markRunning` / `markSuccess` / `markFailed`. There's no Redis/BullMQ because nothing enqueues real work yet; this exists so a future background worker has a table and an interface to slot into without a data-model migration. Whatever implements a provider's `sync()` should push work through this queue rather than making the setter-facing app wait on an external API call — the primary setter experience must never block on an integration (spec section 60).

## Implementing a real provider later

1. Fill in `connect()`/`sync()` in the relevant `lib/integrations/providers/*.ts` file — read credentials from `process.env`, never hardcode them, never log them.
2. Update `IntegrationConfig.status` in the database as connection state actually changes (`CONNECTED`/`ERROR`/`SYNCING`) — the admin page already renders whatever status is actually there.
3. If the integration does meaningful work, route it through `dbJobQueue` (or a real queue if you outgrow the DB-backed one) rather than running synchronously inside a request.
4. Add the provider's status transitions and any new audit-log actions to `SECURITY.md`'s audit logging section.
