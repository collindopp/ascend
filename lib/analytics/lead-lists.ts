import "server-only";
import { subDays, startOfDay, format } from "date-fns";
import { prisma } from "@/lib/db/client";
import { deriveMetrics, setRateFromConversations, sumTotals } from "@/lib/metrics/core";
import { meetsSetRateThreshold } from "@/lib/metrics/thresholds";
import { fetchSessionsInRange, groupBy } from "@/lib/analytics/queries";
import type { DateRange } from "@/lib/utils/date-range";

export async function getLeadListRows(range: DateRange) {
  const rows = await fetchSessionsInRange(range);
  const grouped = groupBy(rows, "leadListId").map((l) => ({
    ...l,
    metrics: deriveMetrics(l),
    rankEligible: meetsSetRateThreshold(l.conversations),
  }));

  // Rank only lists that clear the sample-size threshold; the rest sort after, by volume.
  const eligible = grouped
    .filter((l) => l.rankEligible)
    .sort((a, b) => (b.metrics.setRateFromConversations ?? 0) - (a.metrics.setRateFromConversations ?? 0));
  const ineligible = grouped.filter((l) => !l.rankEligible).sort((a, b) => b.dials - a.dials);

  return [...eligible, ...ineligible];
}

export async function getLeadListDetail(leadListId: string, range: DateRange) {
  const leadList = await prisma.leadList.findUnique({ where: { id: leadListId } });
  if (!leadList) return null;

  const rangeRows = (await fetchSessionsInRange(range)).filter((r) => r.leadListId === leadListId);
  const totals = sumTotals(rangeRows);
  const metrics = deriveMetrics(totals);

  const bySetter = groupBy(rangeRows, "setterId")
    .map((s) => ({
      ...s,
      setRate: meetsSetRateThreshold(s.conversations) ? setRateFromConversations(s.appointments, s.conversations) : null,
    }))
    .sort((a, b) => (b.setRate ?? -1) - (a.setRate ?? -1));

  const since = startOfDay(subDays(new Date(), 29));
  const recentAggregates = await prisma.dailyAggregate.findMany({
    where: { leadListId, date: { gte: since } },
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
    leadList,
    totals,
    metrics,
    rankEligible: meetsSetRateThreshold(totals.conversations),
    bySetter,
    dailyTrend,
  };
}
