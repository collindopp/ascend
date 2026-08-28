import "server-only";
import { startOfDay, subDays, format } from "date-fns";
import { prisma } from "@/lib/db/client";

const DAYS_SHOWN = 14;

/**
 * A judgment call, not a derived value — the baseline a day's active hours
 * are measured against for the heatmap tint. Adjust if it doesn't match how
 * this team actually schedules (e.g. part-time reps, weekends worked).
 */
export const EXPECTED_HOURS_PER_DAY = 8;

export interface DailyTimeCell {
  date: string;
  label: string;
  hours: number;
}

export interface DailyTimeRow {
  setterId: string;
  setterName: string;
  days: DailyTimeCell[];
}

/** Total active *session* time per rep per day for the last two weeks — not clock-in/out, same "active time" the rest of the app already tracks. */
export async function getDailyTimeWorked(): Promise<DailyTimeRow[]> {
  const since = startOfDay(subDays(new Date(), DAYS_SHOWN - 1));

  const [setters, aggregates] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["SETTER", "ADMIN"] }, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.dailyAggregate.groupBy({
      by: ["setterId", "date"],
      where: { date: { gte: since } },
      _sum: { durationSeconds: true },
    }),
  ]);

  const bySetter = new Map<string, Map<string, number>>();
  for (const a of aggregates) {
    const key = format(a.date, "yyyy-MM-dd");
    const bucket = bySetter.get(a.setterId) ?? new Map<string, number>();
    bucket.set(key, (bucket.get(key) ?? 0) + (a._sum.durationSeconds ?? 0));
    bySetter.set(a.setterId, bucket);
  }

  const dayKeys: { date: string; label: string }[] = [];
  for (let i = DAYS_SHOWN - 1; i >= 0; i--) {
    const d = startOfDay(subDays(new Date(), i));
    dayKeys.push({ date: format(d, "yyyy-MM-dd"), label: format(d, "EEE d") });
  }

  return setters.map((s) => ({
    setterId: s.id,
    setterName: s.name,
    days: dayKeys.map((dk) => ({
      date: dk.date,
      label: dk.label,
      hours: (bySetter.get(s.id)?.get(dk.date) ?? 0) / 3600,
    })),
  }));
}
