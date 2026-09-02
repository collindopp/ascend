import "server-only";
import { prisma } from "@/lib/db/client";
import { getCurrentWeekRange, getWeeklyGoalProgress } from "@/lib/goals/queries";
import { startOfBusinessDay } from "@/lib/utils/business-day";

export interface MorningBrief {
  /** This week's sets against the rep's target. Target is null until a manager sets one. */
  goal: { target: number | null; current: number; remaining: number | null; percent: number | null };
  /** Rank among reps who have a goal set, so it compares like with like. */
  rank: { position: number; of: number } | null;
  today: { conversations: number; appointments: number; textAppointments: number; sets: number };
  /** Days with any logged activity this week, against days of the week elapsed so far. */
  daysLogged: { logged: number; elapsed: number };
}

/**
 * What a rep needs on opening the app: where they stand this week, what
 * they've done today, and how far there is left to go.
 *
 * Today's figures come from live session rows rather than DailyAggregate,
 * which is only rebuilt when a session ends — mid-shift it would report zero
 * and the screen would look broken to the person who just booked something.
 */
export async function getMorningBrief(setterId: string): Promise<MorningBrief> {
  const { start, end } = getCurrentWeekRange();
  const dayStart = startOfBusinessDay();

  const [progress, todaySessions, todayTexts, weekSessions, weekTexts] = await Promise.all([
    getWeeklyGoalProgress(),
    prisma.callingSession.findMany({
      where: { setterId, startedAt: { gte: dayStart } },
      select: { conversations: true, appointments: true },
    }),
    prisma.textAppointment.count({ where: { setterId, createdAt: { gte: dayStart } } }),
    prisma.callingSession.findMany({
      where: { setterId, startedAt: { gte: start, lte: end } },
      select: { startedAt: true },
    }),
    prisma.textAppointment.findMany({
      where: { setterId, createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    }),
  ]);

  const mine = progress.find((p) => p.id === setterId);
  const target = mine?.target ?? null;
  const current = mine?.current ?? 0;

  // Ranked only against reps who also have a target — comparing someone with
  // a goal to someone without one isn't a standing, it's noise.
  const ranked = progress.filter((p) => p.target !== null && p.target > 0);
  const position = ranked.findIndex((p) => p.id === setterId);
  const rank = position >= 0 ? { position: position + 1, of: ranked.length } : null;

  const conversations = todaySessions.reduce((sum, s) => sum + s.conversations, 0);
  const appointments = todaySessions.reduce((sum, s) => sum + s.appointments, 0);

  // Distinct calendar days touched this week, in business time.
  const dayKeys = new Set<string>();
  for (const s of weekSessions) dayKeys.add(startOfBusinessDay(s.startedAt).toISOString());
  for (const t of weekTexts) dayKeys.add(startOfBusinessDay(t.createdAt).toISOString());
  const elapsed = Math.min(7, Math.floor((dayStart.getTime() - start.getTime()) / 86_400_000) + 1);

  return {
    goal: {
      target,
      current,
      remaining: target !== null ? Math.max(0, target - current) : null,
      percent: target !== null && target > 0 ? (current / target) * 100 : null,
    },
    rank,
    today: { conversations, appointments, textAppointments: todayTexts, sets: appointments + todayTexts },
    daysLogged: { logged: dayKeys.size, elapsed: Math.max(1, elapsed) },
  };
}
