import "server-only";
import { subDays, startOfDay, format } from "date-fns";
import { prisma } from "@/lib/db/client";
import { deriveMetrics, setRateFromConversations, sumTotals } from "@/lib/metrics/core";
import { meetsSetRateThreshold } from "@/lib/metrics/thresholds";
import { fetchSessionsInRange, groupBy } from "@/lib/analytics/queries";
import type { DateRange } from "@/lib/utils/date-range";

/**
 * Text appointments are logged independently of any calling session, so they
 * only exist in DailyAggregate — never in the raw CallingSession rows that
 * fetchSessionsInRange/groupBy work from. Summed separately and merged in,
 * kept out of `metrics`/`RawTotals` so they never influence set rate.
 */
async function fetchTextAppointmentsBySetter(range: DateRange): Promise<Map<string, number>> {
  const rows = await prisma.dailyAggregate.groupBy({
    by: ["setterId"],
    where: { date: { gte: range.start, lte: range.end } },
    _sum: { textAppointments: true },
  });
  return new Map(rows.map((r) => [r.setterId, r._sum.textAppointments ?? 0]));
}

export async function getSetterRows(range: DateRange) {
  const [rows, textTotals] = await Promise.all([fetchSessionsInRange(range), fetchTextAppointmentsBySetter(range)]);
  const grouped = groupBy(rows, "setterId").map((s) => ({
    ...s,
    metrics: deriveMetrics(s),
    textAppointments: textTotals.get(s.id) ?? 0,
  }));

  // A setter who only logged text appointments (no calls in range) wouldn't
  // otherwise appear here, since this is built from CallingSession rows.
  const missingIds = [...textTotals.keys()].filter((id) => !grouped.some((g) => g.id === id));
  if (missingIds.length > 0) {
    const missingSetters = await prisma.user.findMany({ where: { id: { in: missingIds } }, select: { id: true, name: true } });
    for (const setter of missingSetters) {
      const zeroTotals = { dials: 0, conversations: 0, appointments: 0, dq: 0, wrongNumber: 0, durationSeconds: 0 };
      grouped.push({
        id: setter.id,
        name: setter.name,
        ...zeroTotals,
        sessionsCount: 0,
        metrics: deriveMetrics(zeroTotals),
        textAppointments: textTotals.get(setter.id) ?? 0,
      });
    }
  }

  return grouped.sort((a, b) => b.appointments - a.appointments);
}

export async function getSetterDetail(setterId: string, range: DateRange) {
  const setter = await prisma.user.findUnique({ where: { id: setterId }, select: { id: true, name: true, email: true } });
  if (!setter) return null;

  const rangeRows = (await fetchSessionsInRange(range)).filter((r) => r.setterId === setterId);
  const totals = sumTotals(rangeRows);
  const metrics = deriveMetrics(totals);

  const sessionsCount = rangeRows.length;

  const textAppointmentsAgg = await prisma.dailyAggregate.aggregate({
    where: { setterId, date: { gte: range.start, lte: range.end } },
    _sum: { textAppointments: true },
  });
  const textAppointments = textAppointmentsAgg._sum.textAppointments ?? 0;

  // Per-lead-list breakdown for this setter within the range — best/worst lists.
  const byLeadList = groupBy(rangeRows, "leadListId")
    .map((l) => ({
      ...l,
      setRate: meetsSetRateThreshold(l.conversations) ? setRateFromConversations(l.appointments, l.conversations) : null,
    }))
    .filter((l) => l.setRate !== null)
    .sort((a, b) => (b.setRate as number) - (a.setRate as number));

  const bestLeadLists = byLeadList.slice(0, 3);
  const worstLeadLists = [...byLeadList].reverse().slice(0, 3);

  // Fixed 30-day trend independent of the selected range, same pattern as personal performance.
  const since = startOfDay(subDays(new Date(), 29));
  const recentAggregates = await prisma.dailyAggregate.findMany({
    where: { setterId, date: { gte: since } },
    orderBy: { date: "asc" },
  });
  const byDate = new Map<string, { dials: number; conversations: number; appointments: number }>();
  for (const a of recentAggregates) {
    const key = format(a.date, "yyyy-MM-dd");
    const existing = byDate.get(key) ?? { dials: 0, conversations: 0, appointments: 0 };
    byDate.set(key, {
      dials: existing.dials + a.dials,
      conversations: existing.conversations + a.conversations,
      appointments: existing.appointments + a.appointments,
    });
  }
  const dailyTrend: { date: string; dials: number; conversations: number; appointments: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = startOfDay(subDays(new Date(), i));
    const key = format(day, "yyyy-MM-dd");
    const totalsForDay = byDate.get(key) ?? { dials: 0, conversations: 0, appointments: 0 };
    dailyTrend.push({ date: format(day, "MMM d"), ...totalsForDay });
  }

  return {
    setter: { id: setter.id, name: setter.name, email: setter.email },
    totals,
    metrics,
    sessionsCount,
    textAppointments,
    bestLeadLists,
    worstLeadLists,
    dailyTrend,
  };
}
