-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'SETTER');

-- CreateEnum
CREATE TYPE "LeadListStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SessionEventType" AS ENUM ('DIAL', 'CONVERSATION', 'APPOINTMENT', 'UNDO');

-- CreateEnum
CREATE TYPE "IntegrationProviderName" AS ENUM ('QUICKBASE', 'SCOUT_DATA', 'TWO_X_CONNECT');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('NOT_CONNECTED', 'CONNECTED', 'ERROR', 'SYNCING');

-- CreateEnum
CREATE TYPE "IntegrationJobType" AS ENUM ('IMPORT', 'EXPORT', 'SYNC');

-- CreateEnum
CREATE TYPE "IntegrationJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SETTER',
    "teamId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_lists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "status" "LeadListStatus" NOT NULL DEFAULT 'ACTIVE',
    "leadCount" INTEGER,
    "externalId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calling_sessions" (
    "id" TEXT NOT NULL,
    "setterId" TEXT NOT NULL,
    "leadListId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "dials" INTEGER NOT NULL DEFAULT 0,
    "conversations" INTEGER NOT NULL DEFAULT 0,
    "appointments" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calling_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "SessionEventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_aggregates" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "setterId" TEXT NOT NULL,
    "leadListId" TEXT NOT NULL,
    "dials" INTEGER NOT NULL DEFAULT 0,
    "conversations" INTEGER NOT NULL DEFAULT 0,
    "appointments" INTEGER NOT NULL DEFAULT 0,
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_configs" (
    "id" TEXT NOT NULL,
    "provider" "IntegrationProviderName" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "lastSyncAt" TIMESTAMP(3),
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_jobs" (
    "id" TEXT NOT NULL,
    "provider" "IntegrationProviderName" NOT NULL,
    "type" "IntegrationJobType" NOT NULL,
    "status" "IntegrationJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_teamId_idx" ON "users"("teamId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "lead_lists_status_idx" ON "lead_lists"("status");

-- CreateIndex
CREATE INDEX "calling_sessions_setterId_idx" ON "calling_sessions"("setterId");

-- CreateIndex
CREATE INDEX "calling_sessions_leadListId_idx" ON "calling_sessions"("leadListId");

-- CreateIndex
CREATE INDEX "calling_sessions_status_idx" ON "calling_sessions"("status");

-- CreateIndex
CREATE INDEX "calling_sessions_startedAt_idx" ON "calling_sessions"("startedAt");

-- CreateIndex
CREATE INDEX "session_events_sessionId_idx" ON "session_events"("sessionId");

-- CreateIndex
CREATE INDEX "session_events_createdAt_idx" ON "session_events"("createdAt");

-- CreateIndex
CREATE INDEX "daily_aggregates_date_idx" ON "daily_aggregates"("date");

-- CreateIndex
CREATE INDEX "daily_aggregates_setterId_idx" ON "daily_aggregates"("setterId");

-- CreateIndex
CREATE INDEX "daily_aggregates_leadListId_idx" ON "daily_aggregates"("leadListId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_aggregates_date_setterId_leadListId_key" ON "daily_aggregates"("date", "setterId", "leadListId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "integration_configs_provider_key" ON "integration_configs"("provider");

-- CreateIndex
CREATE INDEX "integration_jobs_provider_idx" ON "integration_jobs"("provider");

-- CreateIndex
CREATE INDEX "integration_jobs_status_idx" ON "integration_jobs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_lists" ADD CONSTRAINT "lead_lists_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calling_sessions" ADD CONSTRAINT "calling_sessions_setterId_fkey" FOREIGN KEY ("setterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calling_sessions" ADD CONSTRAINT "calling_sessions_leadListId_fkey" FOREIGN KEY ("leadListId") REFERENCES "lead_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_events" ADD CONSTRAINT "session_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "calling_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_aggregates" ADD CONSTRAINT "daily_aggregates_setterId_fkey" FOREIGN KEY ("setterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_aggregates" ADD CONSTRAINT "daily_aggregates_leadListId_fkey" FOREIGN KEY ("leadListId") REFERENCES "lead_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_jobs" ADD CONSTRAINT "integration_jobs_provider_fkey" FOREIGN KEY ("provider") REFERENCES "integration_configs"("provider") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Data integrity: non-negative counters (section 22 of the ASCEND spec — never allow negative dials/conversations/etc.)
ALTER TABLE "calling_sessions" ADD CONSTRAINT "calling_sessions_counts_nonnegative"
    CHECK ("dials" >= 0 AND "conversations" >= 0 AND "appointments" >= 0);

ALTER TABLE "calling_sessions" ADD CONSTRAINT "calling_sessions_valid_timespan"
    CHECK ("endedAt" IS NULL OR "endedAt" >= "startedAt");

ALTER TABLE "lead_lists" ADD CONSTRAINT "lead_lists_leadcount_nonnegative"
    CHECK ("leadCount" IS NULL OR "leadCount" >= 0);

ALTER TABLE "daily_aggregates" ADD CONSTRAINT "daily_aggregates_counts_nonnegative"
    CHECK ("dials" >= 0 AND "conversations" >= 0 AND "appointments" >= 0 AND "sessionsCount" >= 0 AND "durationSeconds" >= 0);

ALTER TABLE "integration_jobs" ADD CONSTRAINT "integration_jobs_attempts_nonnegative"
    CHECK ("attempts" >= 0);

-- A setter can never have two ACTIVE calling sessions at once (section 8 of the ASCEND spec).
-- Enforced at the DB level as the hard backstop behind the app-level pre-check.
CREATE UNIQUE INDEX "calling_sessions_one_active_per_setter"
    ON "calling_sessions"("setterId")
    WHERE "status" = 'ACTIVE';
