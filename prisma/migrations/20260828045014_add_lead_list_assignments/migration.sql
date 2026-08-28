-- CreateTable
CREATE TABLE "lead_list_assignments" (
    "id" TEXT NOT NULL,
    "leadListId" TEXT NOT NULL,
    "setterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_list_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_list_assignments_leadListId_idx" ON "lead_list_assignments"("leadListId");

-- CreateIndex
CREATE INDEX "lead_list_assignments_setterId_idx" ON "lead_list_assignments"("setterId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_list_assignments_leadListId_setterId_key" ON "lead_list_assignments"("leadListId", "setterId");

-- AddForeignKey
ALTER TABLE "lead_list_assignments" ADD CONSTRAINT "lead_list_assignments_leadListId_fkey" FOREIGN KEY ("leadListId") REFERENCES "lead_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_list_assignments" ADD CONSTRAINT "lead_list_assignments_setterId_fkey" FOREIGN KEY ("setterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
