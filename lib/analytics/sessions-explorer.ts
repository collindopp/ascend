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

export async function getSessionsList(filters: SessionExplorerFilters) {
  const where = {
    startedAt: { gte: filters.range.start, lte: filters.range.end },
    ...(filters.setterId ? { setterId: filters.setterId } : {}),
    ...(filters.leadListId ? { leadListId: filters.leadListId } : {}),
  };

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

export async function getFilterOptions() {
  const [setters, leadLists] = await Promise.all([
    prisma.user.findMany({ where: { role: "SETTER" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.leadList.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return { setters, leadLists };
}
