-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SessionEventType" ADD VALUE 'PICK_UP';
ALTER TYPE "SessionEventType" ADD VALUE 'NOT_INTERESTED';
ALTER TYPE "SessionEventType" ADD VALUE 'FOLLOW_UP';

-- AlterTable
ALTER TABLE "calling_sessions" ADD COLUMN     "followUp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "notInterested" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pickUps" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "daily_aggregates" ADD COLUMN     "followUp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "notInterested" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pickUps" INTEGER NOT NULL DEFAULT 0;

-- Extend the non-negative check constraints to cover the three new counters
-- (existing rows already satisfy this trivially, since they default to 0).
ALTER TABLE "calling_sessions" DROP CONSTRAINT "calling_sessions_counts_nonnegative";
ALTER TABLE "calling_sessions" ADD CONSTRAINT "calling_sessions_counts_nonnegative"
    CHECK ("dials" >= 0 AND "conversations" >= 0 AND "appointments" >= 0 AND "dq" >= 0 AND "wrongNumber" >= 0 AND "pickUps" >= 0 AND "notInterested" >= 0 AND "followUp" >= 0);

ALTER TABLE "daily_aggregates" DROP CONSTRAINT "daily_aggregates_counts_nonnegative";
ALTER TABLE "daily_aggregates" ADD CONSTRAINT "daily_aggregates_counts_nonnegative"
    CHECK ("dials" >= 0 AND "conversations" >= 0 AND "appointments" >= 0 AND "dq" >= 0 AND "wrongNumber" >= 0 AND "pickUps" >= 0 AND "notInterested" >= 0 AND "followUp" >= 0 AND "sessionsCount" >= 0 AND "durationSeconds" >= 0);
