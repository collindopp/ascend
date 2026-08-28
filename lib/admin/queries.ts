import "server-only";
import { prisma } from "@/lib/db/client";
import { getAllProviders } from "@/lib/integrations/registry";

/** Explicit select (never passwordHash) — a DTO boundary even though today's only consumer is a Server Component. */
export async function getUsersForAdmin() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      teamId: true,
      createdAt: true,
      team: { select: { id: true, name: true } },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export async function getTeamsForAdmin() {
  const teams = await prisma.team.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { name: "asc" },
  });
  return teams;
}

export async function getLeadListsForAdmin() {
  return prisma.leadList.findMany({
    include: {
      _count: { select: { callingSessions: true } },
      assignments: { select: { setterId: true } },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}

/** Setters who can be assigned to a list — admins tally too but always see every list. */
export async function getAssignableSetters() {
  return prisma.user.findMany({
    where: { role: "SETTER", active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getAuditLogPage(page: number, pageSize: number) {
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count(),
  ]);
  return { rows, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getSystemSettings() {
  return prisma.systemSetting.findMany({ orderBy: { key: "asc" } });
}

/**
 * Goes through the provider registry (never queries a concrete provider
 * directly) so this page exercises the same dependency-inverted path a
 * real sync job would use. Status is whatever the provider truthfully
 * reports — never hardcoded to CONNECTED.
 */
export async function getIntegrationStatuses() {
  const providers = getAllProviders();
  return Promise.all(
    providers.map(async (provider) => {
      const [status, config] = await Promise.all([
        provider.getStatus(),
        prisma.integrationConfig.findUnique({ where: { provider: provider.name } }),
      ]);
      return { provider: provider.name, status, lastSyncAt: config?.lastSyncAt ?? null };
    }),
  );
}
