// Deliberately no `import "server-only"` here — this module is also
// imported directly by prisma/seed.ts, a standalone script outside the
// Next.js server-component bundling context where that guard would throw.
import { startOfDay, endOfDay } from "date-fns";
import { prisma } from "@/lib/db/client";

/**
 * Recomputes the DailyAggregate row for one (date, setter, lead list) bucket
 * from raw CallingSession rows. Aggregates are always derived, never the
 * source of truth — safe to call repeatedly, and the whole table could be
 * dropped and rebuilt from calling_sessions without losing information
 * (section 47 of the ASCEND spec).
 */
export async function rebuildDailyAggregate(params: {
  date: Date;
  setterId: string;
  leadListId: string;
}): Promise<void> {
  const dayStart = startOfDay(params.date);
  const dayEnd = endOfDay(params.date);

  const sessions = await prisma.callingSession.findMany({
    where: {
      setterId: params.setterId,
      leadListId: params.leadListId,
      status: "COMPLETED",
      startedAt: { gte: dayStart, lte: dayEnd },
    },
    select: {
      dials: true,
      conversations: true,
      appointments: true,
      dq: true,
      wrongNumber: true,
      pickUps: true,
      notInterested: true,
      followUp: true,
      startedAt: true,
      endedAt: true,
    },
  });

  const totals = sessions.reduce(
    (acc, s) => {
      acc.dials += s.dials;
      acc.conversations += s.conversations;
      acc.appointments += s.appointments;
      acc.dq += s.dq;
      acc.wrongNumber += s.wrongNumber;
      acc.pickUps += s.pickUps;
      acc.notInterested += s.notInterested;
      acc.followUp += s.followUp;
      acc.sessionsCount += 1;
      if (s.endedAt) {
        acc.durationSeconds += Math.max(0, Math.round((s.endedAt.getTime() - s.startedAt.getTime()) / 1000));
      }
      return acc;
    },
    {
      dials: 0,
      conversations: 0,
      appointments: 0,
      dq: 0,
      wrongNumber: 0,
      pickUps: 0,
      notInterested: 0,
      followUp: 0,
      sessionsCount: 0,
      durationSeconds: 0,
    },
  );

  await prisma.dailyAggregate.upsert({
    where: {
      date_setterId_leadListId: {
        date: dayStart,
        setterId: params.setterId,
        leadListId: params.leadListId,
      },
    },
    update: totals,
    create: {
      date: dayStart,
      setterId: params.setterId,
      leadListId: params.leadListId,
      ...totals,
    },
  });
}

/** Convenience wrapper called right after a session is ended. */
export async function rebuildAggregateForSession(session: {
  setterId: string;
  leadListId: string;
  startedAt: Date;
}): Promise<void> {
  await rebuildDailyAggregate({
    date: session.startedAt,
    setterId: session.setterId,
    leadListId: session.leadListId,
  });
}
