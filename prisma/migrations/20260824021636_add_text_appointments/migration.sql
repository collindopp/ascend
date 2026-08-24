-- AlterTable
ALTER TABLE "daily_aggregates" ADD COLUMN     "textAppointments" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "text_appointments" (
    "id" TEXT NOT NULL,
    "setterId" TEXT NOT NULL,
    "leadListId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "text_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "text_appointments_setterId_idx" ON "text_appointments"("setterId");

-- CreateIndex
CREATE INDEX "text_appointments_leadListId_idx" ON "text_appointments"("leadListId");

-- CreateIndex
CREATE INDEX "text_appointments_createdAt_idx" ON "text_appointments"("createdAt");

-- AddForeignKey
ALTER TABLE "text_appointments" ADD CONSTRAINT "text_appointments_setterId_fkey" FOREIGN KEY ("setterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "text_appointments" ADD CONSTRAINT "text_appointments_leadListId_fkey" FOREIGN KEY ("leadListId") REFERENCES "lead_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Extend the non-negative check constraint to cover the new counter
-- (existing rows already satisfy this trivially, since it defaults to 0).
ALTER TABLE "daily_aggregates" DROP CONSTRAINT "daily_aggregates_counts_nonnegative";
ALTER TABLE "daily_aggregates" ADD CONSTRAINT "daily_aggregates_counts_nonnegative"
    CHECK ("dials" >= 0 AND "conversations" >= 0 AND "appointments" >= 0 AND "dq" >= 0 AND "wrongNumber" >= 0 AND "pickUps" >= 0 AND "notInterested" >= 0 AND "followUp" >= 0 AND "textAppointments" >= 0 AND "sessionsCount" >= 0 AND "durationSeconds" >= 0);
