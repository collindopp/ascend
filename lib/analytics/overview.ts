import "server-only";
import { prisma } from "@/lib/db/client";
import { deriveMetrics, sumTotals } from "@/lib/metrics/core";
import { fetchSessionsInRange, groupBy } from "@/lib/analytics/queries";
import type { DateRange } from "@/lib/utils/date-range";

export async function getTeamOverview(range: DateRange) {
  const rows = await fetchSessionsInRange(range);
  const totals = sumTotals(rows);
  const metrics = deriveMetrics(totals);

  const [activeSessionsCount, textAppointmentsAgg] = await Promise.all([
    prisma.callingSession.count({ where: { status: "ACTIVE" } }),
    prisma.dailyAggregate.aggregate({
      where: { date: { gte: range.start, lte: range.end } },
      _sum: { textAppointments: true },
    }),
  ]);
  const settersActiveInRange = new Set(rows.map((r) => r.setterId)).size;

  const bySetter = groupBy(rows, "setterId").sort((a, b) => b.appointments - a.appointments);

  return {
    totals,
    metrics,
    activeSessionsCount,
    settersActiveInRange,
    textAppointments: textAppointmentsAgg._sum.textAppointments ?? 0,
    topSetters: bySetter.slice(0, 5),
    sessionsCount: rows.length,
  };
}
