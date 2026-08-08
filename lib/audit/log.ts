import "server-only";
import { prisma } from "@/lib/db/client";
import type { Prisma } from "@/lib/generated/prisma/client";

interface AuditLogInput {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Writes an audit trail entry. Never pass secrets/credentials in metadata —
 * this table has no special access restriction beyond normal admin auth.
 */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
  } catch (error) {
    // Audit logging must never break the primary action it's observing.
    console.error("Failed to write audit log", { action: input.action, error });
  }
}
