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
async function fetchTextAppointmentsByLeadList(range: DateRange): Promise<Map<string, number>> {
  const rows = await prisma.dailyAggregate.groupBy({
    by: ["leadListId"],
    where: { date: { gte: range.start, lte: range.end } },
    _sum: { textAppointments: true },
  });
  return new Map(rows.map((r) => [r.leadListId, r._sum.textAppointments ?? 0]));
}

export async function getLeadListRows(range: DateRange) {
  const [rows, textTotals] = await Promise.all([fetchSessionsInRange(range), fetchTextAppointmentsByLeadList(range)]);
  const grouped = groupBy(rows, "leadListId").map((l) => ({
    ...l,
    metrics: deriveMetrics(l),
    rankEligible: meetsSetRateThreshold(l.conversations),
    textAppointments: textTotals.get(l.id) ?? 0,
  }));

  // A list worked purely over text (no calls at all in range) wouldn't
  // otherwise appear here, since it's built from CallingSession rows —
  // pull those in too so text-only activity is never invisible.
  const missingIds = [...textTotals.keys()].filter((id) => !grouped.some((g) => g.id === id));
  if (missingIds.length > 0) {
    const missingLists = await prisma.leadList.findMany({ where: { id: { in: missingIds } }, select: { id: true, name: true } });
    for (const list of missingLists) {
      grouped.push({
        id: list.id,
        name: list.name,
        dials: 0,
        conversations: 0,
        appointments: 0,
        dq: 0,
        wrongNumber: 0,
        durationSeconds: 0,
        sessionsCount: 0,
        metrics: deriveMetrics({ dials: 0, conversations: 0, appointments: 0, dq: 0, wrongNumber: 0, durationSeconds: 0 }),
        rankEligible: false,
        textAppointments: textTotals.get(list.id) ?? 0,
      });
    }
  }

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

  const textBySetter = await prisma.dailyAggregate.groupBy({
    by: ["setterId"],
    where: { leadListId, date: { gte: range.start, lte: range.end } },
    _sum: { textAppointments: true },
  });
  const textBySetterMap = new Map(textBySetter.map((r) => [r.setterId, r._sum.textAppointments ?? 0]));
  const textAppointments = [...textBySetterMap.values()].reduce((sum, n) => sum + n, 0);

  const bySetter = groupBy(rangeRows, "setterId")
    .map((s) => ({
      ...s,
      setRate: meetsSetRateThreshold(s.conversations) ? setRateFromConversations(s.appointments, s.conversations) : null,
      textAppointments: textBySetterMap.get(s.id) ?? 0,
    }))
    .sort((a, b) => (b.setRate ?? -1) - (a.setRate ?? -1));

  // A setter who only ever texted this list (no calls) wouldn't otherwise appear here.
  const missingSetterIds = [...textBySetterMap.keys()].filter((id) => !bySetter.some((s) => s.id === id));
  if (missingSetterIds.length > 0) {
    const missingSetters = await prisma.user.findMany({ where: { id: { in: missingSetterIds } }, select: { id: true, name: true } });
    for (const setter of missingSetters) {
      bySetter.push({
        id: setter.id,
        name: setter.name,
        dials: 0,
        conversations: 0,
        appointments: 0,
        dq: 0,
        wrongNumber: 0,
        durationSeconds: 0,
        sessionsCount: 0,
        setRate: null,
        textAppointments: textBySetterMap.get(setter.id) ?? 0,
      });
    }
    bySetter.sort((a, b) => (b.setRate ?? -1) - (a.setRate ?? -1));
  }

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
    textAppointments,
    bySetter,
    dailyTrend,
  };
}
