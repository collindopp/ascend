import "server-only";
import { startOfWeek, endOfWeek } from "date-fns";
import { prisma } from "@/lib/db/client";

/**
 * Monday–Sunday, same server-local-time convention every other date-range
 * computation in this app already uses (see lib/utils/date-range.ts) — kept
 * consistent rather than introducing a separately-timezoned notion of "week."
 */
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  };
}

export interface WeeklyGoalRow {
  id: string;
  name: string;
  target: number | null;
  current: number;
  percent: number | null;
}

/**
 * "Sets" for goal purposes = calling appointments + text appointments —
 * every appointment a rep booked this week, regardless of channel. Kept
 * separate from the calling-only `RawTotals`/metrics pipeline (same as
 * everywhere else text appointments are surfaced); this is a raw count for
 * a progress bar, not a rate calculation, so combining channels here is safe.
 */
export async function getWeeklyGoalProgress(): Promise<WeeklyGoalRow[]> {
  const { start, end } = getCurrentWeekRange();

  const [setters, goals, aggregates] = await Promise.all([
    // This is the one leaderboard-adjacent view built from the full roster
    // rather than derived from activity — everywhere else naturally rolls
    // an inactive setter off over time as their sessions age out of the
    // selected range, but this always lists everyone. Filter here so a
    // deactivated rep doesn't linger forever with "no goal set."
    prisma.user.findMany({
      where: { role: { in: ["SETTER", "ADMIN"] }, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.weeklyGoal.findMany({ where: { weekStart: start } }),
    prisma.dailyAggregate.groupBy({
      by: ["setterId"],
      where: { date: { gte: start, lte: end } },
      _sum: { appointments: true, textAppointments: true },
    }),
  ]);

  const goalMap = new Map(goals.map((g) => [g.setterId, g.target]));
  const currentMap = new Map(aggregates.map((a) => [a.setterId, (a._sum.appointments ?? 0) + (a._sum.textAppointments ?? 0)]));

  return setters
    .map((s) => {
      const target = goalMap.get(s.id) ?? null;
      const current = currentMap.get(s.id) ?? 0;
      return {
        id: s.id,
        name: s.name,
        target,
        current,
        percent: target !== null && target > 0 ? (current / target) * 100 : null,
      };
    })
    .sort((a, b) => {
      if (a.percent === null && b.percent === null) return b.current - a.current;
      if (a.percent === null) return 1;
      if (b.percent === null) return -1;
      return b.percent - a.percent;
    });
}

/** Current-week goal targets keyed by setter, for the goal-setting admin/manager page. */
export async function getCurrentWeekGoalTargets(): Promise<Map<string, number>> {
  const { start } = getCurrentWeekRange();
  const goals = await prisma.weeklyGoal.findMany({ where: { weekStart: start } });
  return new Map(goals.map((g) => [g.setterId, g.target]));
}
