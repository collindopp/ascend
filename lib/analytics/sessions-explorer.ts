import "server-only";
import { prisma } from "@/lib/db/client";
import type { DateRange } from "@/lib/utils/date-range";

export interface SessionExplorerFilters {
  range: DateRange;
  setterId?: string;
  leadListId?: string;
  page: number;
  pageSize: number;
}

function buildWhere(filters: Pick<SessionExplorerFilters, "range" | "setterId" | "leadListId">) {
  return {
    startedAt: { gte: filters.range.start, lte: filters.range.end },
    ...(filters.setterId ? { setterId: filters.setterId } : {}),
    ...(filters.leadListId ? { leadListId: filters.leadListId } : {}),
  };
}

export async function getSessionsList(filters: SessionExplorerFilters) {
  const where = buildWhere(filters);

  const [rows, total] = await Promise.all([
    prisma.callingSession.findMany({
      where,
      include: { setter: { select: { id: true, name: true } }, leadList: { select: { id: true, name: true } } },
      orderBy: { startedAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.callingSession.count({ where }),
  ]);

  return { rows, total, pageCount: Math.max(1, Math.ceil(total / filters.pageSize)) };
}

const EXPORT_ROW_CAP = 20_000;

/** Unpaginated — for CSV export, capped well above any realistic internal-team volume. */
export async function getSessionsForExport(filters: Pick<SessionExplorerFilters, "range" | "setterId" | "leadListId">) {
  return prisma.callingSession.findMany({
    where: buildWhere(filters),
    include: { setter: { select: { id: true, name: true } }, leadList: { select: { id: true, name: true } } },
    orderBy: { startedAt: "desc" },
    take: EXPORT_ROW_CAP,
  });
}

export async function getFilterOptions() {
  const [setters, leadLists] = await Promise.all([
    // Admins can tally their own calls too (see the (setter) layout), so they
    // need to be filterable here as well — not just plain SETTER accounts.
    prisma.user.findMany({
      where: { role: { in: ["SETTER", "ADMIN"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.leadList.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return { setters, leadLists };
}
