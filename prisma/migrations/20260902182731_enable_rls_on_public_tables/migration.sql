-- Locks the Supabase Data API out of every table in `public`.
--
-- Supabase serves the `public` schema over PostgREST using the `anon` key,
-- which is public by design. With row-level security disabled and no policies,
-- that endpoint granted full read AND write access to everything — including
-- `users`, which holds emails and bcrypt password hashes. Writing was the
-- sharper risk: anyone could have inserted themselves an ADMIN row.
--
-- Enabling RLS with **no policies** is a deny-all for the `anon` and
-- `authenticated` roles the API uses. No policies are added on purpose: this
-- app never touches the Data API. It connects over the Postgres protocol as
-- `postgres`, which owns every one of these tables and additionally carries
-- BYPASSRLS, so its queries are unaffected.
--
-- Deliberately NOT using FORCE ROW LEVEL SECURITY: that would apply RLS to the
-- table owner as well and, with no policies present, would lock the app out of
-- its own database.

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."lead_lists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."lead_list_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."calling_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."daily_aggregates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."text_appointments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."weekly_goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."integration_configs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."integration_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;

-- Prisma's own bookkeeping table. Same reasoning; the migration engine
-- connects with these same owner credentials.
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
