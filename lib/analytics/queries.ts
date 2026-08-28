import "server-only";
import { cache } from "react";
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
 * Keyed on primitives rather than the DateRange object so the dedupe is by
 * value — two callers that independently resolve "last 30 days" share one
 * query even though they built separate Date objects.
 */
const fetchSessionRows = cache(
  async (
    startMs: number,
    endMs: number,
    teamId?: string,
    setterId?: string,
    leadListId?: string,
  ): Promise<SessionRow[]> => {
    const sessions = await prisma.callingSession.findMany({
      where: {
        startedAt: { gte: new Date(startMs), lte: new Date(endMs) },
        ...(teamId ? { setter: { teamId } } : {}),
        ...(setterId ? { setterId } : {}),
        ...(leadListId ? { leadListId } : {}),
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
  },
);

/**
 * Raw session rows in a date range, including in-progress sessions counted
 * "as of now" — the manager overview needs live numbers, not just what's
 * been finalized into DailyAggregate (section 12: "how is my team
 * performing right now").
 *
 * Memoized per request (same `cache()` pattern as lib/auth/dal.ts): the
 * Overview page reaches this through both getTeamOverview and
 * getOverviewInsights, which would otherwise run the identical query twice.
 *
 * `scope` pushes a single-entity filter into SQL for the detail pages, which
 * previously fetched every session in the range only to discard all but one
 * setter's or lead list's rows in JS.
 */
export function fetchSessionsInRange(
  range: DateRange,
  teamId?: string,
  scope?: { setterId?: string; leadListId?: string },
): Promise<SessionRow[]> {
  return fetchSessionRows(
    range.start.getTime(),
    range.end.getTime(),
    teamId,
    scope?.setterId,
    scope?.leadListId,
  );
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
