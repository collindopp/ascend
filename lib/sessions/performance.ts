import "server-only";
import { subDays, startOfDay, format } from "date-fns";
import { prisma } from "@/lib/db/client";
import { deriveMetrics, sumTotals, setRateFromConversations, type RawTotals } from "@/lib/metrics/core";
import { meetsSetRateThreshold } from "@/lib/metrics/thresholds";

export interface PersonalPerformance {
  allTime: RawTotals & { sessionsCount: number };
  metrics: ReturnType<typeof deriveMetrics>;
  extras: { pickUps: number; notInterested: number; followUp: number };
  teamAverageSetRate: number | null;
  bestSession: {
    id: string;
    leadListName: string;
    startedAt: Date;
    appointments: number;
    setRate: number | null;
  } | null;
  dailyTrend: { date: string; dials: number; conversations: number; appointments: number }[];
}

/** Personal performance for a setter's own dashboard — all-time totals, best session, team comparison, 30-day trend. */
export async function getPersonalPerformance(setterId: string): Promise<PersonalPerformance> {
  const aggregates = await prisma.dailyAggregate.findMany({ where: { setterId } });

  const allTimeTotals = sumTotals(
    aggregates.map((a) => ({
      dials: a.dials,
      conversations: a.conversations,
      appointments: a.appointments,
      dq: a.dq,
      wrongNumber: a.wrongNumber,
      durationSeconds: a.durationSeconds,
    })),
  );
  const sessionsCount = aggregates.reduce((sum, a) => sum + a.sessionsCount, 0);
  const metrics = deriveMetrics(allTimeTotals);

  // Kept separate from RawTotals/deriveMetrics — these are plain tracked
  // counts, not part of any existing rate calculation.
  const extras = aggregates.reduce(
    (acc, a) => ({
      pickUps: acc.pickUps + a.pickUps,
      notInterested: acc.notInterested + a.notInterested,
      followUp: acc.followUp + a.followUp,
    }),
    { pickUps: 0, notInterested: 0, followUp: 0 },
  );

  // Team average set rate across all setters, all-time — for the "vs team" comparison.
  const teamAgg = await prisma.dailyAggregate.aggregate({
    _sum: { conversations: true, appointments: true },
  });
  const teamConversations = teamAgg._sum.conversations ?? 0;
  const teamAppointments = teamAgg._sum.appointments ?? 0;
  const teamAverageSetRate = meetsSetRateThreshold(teamConversations)
    ? setRateFromConversations(teamAppointments, teamConversations)
    : null;

  const bestSessionRaw = await prisma.callingSession.findFirst({
    where: { setterId, status: "COMPLETED" },
    include: { leadList: true },
    orderBy: [{ appointments: "desc" }, { conversations: "desc" }],
  });
  const bestSession = bestSessionRaw
    ? {
        id: bestSessionRaw.id,
        leadListName: bestSessionRaw.leadList.name,
        startedAt: bestSessionRaw.startedAt,
        appointments: bestSessionRaw.appointments,
        setRate: setRateFromConversations(bestSessionRaw.appointments, bestSessionRaw.conversations),
      }
    : null;

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
  const dailyTrend: PersonalPerformance["dailyTrend"] = [];
  for (let i = 29; i >= 0; i--) {
    const day = startOfDay(subDays(new Date(), i));
    const key = format(day, "yyyy-MM-dd");
    const totals = byDate.get(key) ?? { dials: 0, conversations: 0, appointments: 0 };
    dailyTrend.push({ date: format(day, "MMM d"), ...totals });
  }

  return {
    allTime: { ...allTimeTotals, sessionsCount },
    metrics,
    extras,
    teamAverageSetRate,
    bestSession,
    dailyTrend,
  };
}
