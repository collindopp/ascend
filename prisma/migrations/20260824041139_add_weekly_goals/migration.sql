-- CreateTable
CREATE TABLE "weekly_goals" (
    "id" TEXT NOT NULL,
    "setterId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "target" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weekly_goals_weekStart_idx" ON "weekly_goals"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_goals_setterId_weekStart_key" ON "weekly_goals"("setterId", "weekStart");

-- AddForeignKey
ALTER TABLE "weekly_goals" ADD CONSTRAINT "weekly_goals_setterId_fkey" FOREIGN KEY ("setterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Same non-negative defense-in-depth pattern as the other counter tables.
ALTER TABLE "weekly_goals" ADD CONSTRAINT "weekly_goals_target_nonnegative" CHECK ("target" >= 0);
