import "server-only";
import { prisma } from "@/lib/db/client";
import type { JobQueue } from "@/lib/integrations/types";
import type { IntegrationProviderName, IntegrationJobType } from "@/lib/generated/prisma/enums";

/**
 * Simple DB-backed job queue (the IntegrationJob table) — no Redis/BullMQ.
 * Nothing enqueues real jobs yet since no provider is implemented; this
 * gives the abstraction a real, working shape to slot a worker into later
 * without redesigning the data model (section 60).
 */
export const dbJobQueue: JobQueue = {
  async enqueue(provider: IntegrationProviderName, type: IntegrationJobType) {
    const job = await prisma.integrationJob.create({ data: { provider, type, status: "PENDING" } });
    return { jobId: job.id };
  },

  async markRunning(jobId: string) {
    await prisma.integrationJob.update({ where: { id: jobId }, data: { status: "RUNNING", attempts: { increment: 1 } } });
  },

  async markSuccess(jobId: string) {
    await prisma.integrationJob.update({ where: { id: jobId }, data: { status: "SUCCESS" } });
  },

  async markFailed(jobId: string, error: string) {
    await prisma.integrationJob.update({ where: { id: jobId }, data: { status: "FAILED", lastError: error } });
  },
};
