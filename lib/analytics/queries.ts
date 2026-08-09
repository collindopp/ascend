import "server-only";
import { prisma } from "@/lib/db/client";
import type { RawTotals } from "@/lib/metrics/core";
import type { DateRange } from "@/lib/utils/date-range";

export interface SessionRow {
  id: string;
  setterId: string;
  setterName: string;
  leadListId: string;
  leadListName: string;
  dials: number;
  conversations: number;
  appointments: number;
  dq: number;
  wrongNumber: number;
  status: "ACTIVE" | "COMPLETED";
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number;
}

/**
 * Raw session rows in a date range, including in-progress sessions counted
 * "as of now" — the manager overview needs live numbers, not just what's
 * been finalized into DailyAggregate (section 12: "how is my team
 * performing right now").
 */
export async function fetchSessionsInRange(range: DateRange, teamId?: string): Promise<SessionRow[]> {
  const sessions = await prisma.callingSession.findMany({
    where: {
      startedAt: { gte: range.start, lte: range.end },
      ...(teamId ? { setter: { teamId } } : {}),
    },
    include: { setter: { select: { id: true, name: true } }, leadList: { select: { id: true, name: true } } },
    orderBy: { startedAt: "desc" },
  });

  const now = Date.now();
  return sessions.map((s) => ({
    id: s.id,
    setterId: s.setterId,
    setterName: s.setter.name,
    leadListId: s.leadListId,
    leadListName: s.leadList.name,
    dials: s.dials,
    conversations: s.conversations,
    appointments: s.appointments,
    dq: s.dq,
    wrongNumber: s.wrongNumber,
    status: s.status,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    durationSeconds: Math.max(0, Math.round(((s.endedAt?.getTime() ?? now) - s.startedAt.getTime()) / 1000)),
  }));
}

export interface GroupedTotals extends RawTotals {
  id: string;
  name: string;
  sessionsCount: number;
}

export function groupBy(rows: SessionRow[], key: "setterId" | "leadListId"): GroupedTotals[] {
  const nameKey = key === "setterId" ? "setterName" : "leadListName";
  const map = new Map<string, GroupedTotals>();

  for (const row of rows) {
    const id = row[key];
    const existing = map.get(id) ?? {
      id,
      name: row[nameKey],
      dials: 0,
      conversations: 0,
      appointments: 0,
      dq: 0,
      wrongNumber: 0,
      durationSeconds: 0,
      sessionsCount: 0,
    };
    existing.dials += row.dials;
    existing.conversations += row.conversations;
    existing.appointments += row.appointments;
    existing.dq += row.dq;
    existing.wrongNumber += row.wrongNumber;
    existing.durationSeconds += row.durationSeconds;
    existing.sessionsCount += 1;
    map.set(id, existing);
  }

  return [...map.values()];
}

export interface MatrixCell extends RawTotals {
  setterId: string;
  setterName: string;
  leadListId: string;
  leadListName: string;
}

export function groupByCell(rows: SessionRow[]): MatrixCell[] {
  const map = new Map<string, MatrixCell>();
  for (const row of rows) {
    const key = `${row.setterId}:${row.leadListId}`;
    const existing = map.get(key) ?? {
      setterId: row.setterId,
      setterName: row.setterName,
      leadListId: row.leadListId,
      leadListName: row.leadListName,
      dials: 0,
      conversations: 0,
      appointments: 0,
      dq: 0,
      wrongNumber: 0,
      durationSeconds: 0,
    };
    existing.dials += row.dials;
    existing.conversations += row.conversations;
    existing.appointments += row.appointments;
    existing.dq += row.dq;
    existing.wrongNumber += row.wrongNumber;
    existing.durationSeconds += row.durationSeconds;
    map.set(key, existing);
  }
  return [...map.values()];
}
