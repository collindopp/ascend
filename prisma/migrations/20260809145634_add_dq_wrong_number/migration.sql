-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SessionEventType" ADD VALUE 'DQ';
ALTER TYPE "SessionEventType" ADD VALUE 'WRONG_NUMBER';

-- AlterTable
ALTER TABLE "calling_sessions" ADD COLUMN     "dq" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wrongNumber" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "daily_aggregates" ADD COLUMN     "dq" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wrongNumber" INTEGER NOT NULL DEFAULT 0;

-- Data integrity: non-negative counters, same rule as the original counts (section 22 of the ASCEND spec).
ALTER TABLE "calling_sessions" DROP CONSTRAINT "calling_sessions_counts_nonnegative";
ALTER TABLE "calling_sessions" ADD CONSTRAINT "calling_sessions_counts_nonnegative"
    CHECK ("dials" >= 0 AND "conversations" >= 0 AND "appointments" >= 0 AND "dq" >= 0 AND "wrongNumber" >= 0);

ALTER TABLE "daily_aggregates" DROP CONSTRAINT "daily_aggregates_counts_nonnegative";
ALTER TABLE "daily_aggregates" ADD CONSTRAINT "daily_aggregates_counts_nonnegative"
    CHECK ("dials" >= 0 AND "conversations" >= 0 AND "appointments" >= 0 AND "dq" >= 0 AND "wrongNumber" >= 0 AND "sessionsCount" >= 0 AND "durationSeconds" >= 0);
