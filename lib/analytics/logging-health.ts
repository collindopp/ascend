import "server-only";
import { subDays } from "date-fns";
import { prisma } from "@/lib/db/client";
import { startOfBusinessDay } from "@/lib/utils/business-day";

/** How far back to look for a rep's most recent activity before calling it "no recent activity". */
const LOOKBACK_DAYS = 90;

export interface LoggingLapse {
  setterId: string;
  setterName: string;
  /** Null when the rep has logged nothing at all inside the lookback window. */
  lastLoggedAt: Date | null;
  /** Whole days between their last activity and the start of today, business-time. */
  daysSinceLastLogged: number | null;
}

export interface LoggingHealth {
  totalSetters: number;
  loggedTodayCount: number;
  lapses: LoggingLapse[];
}

/**
 * Who hasn't logged anything yet today, and how long it's been since they did.
 *
 * "Today" is the team's working day (see BUSINESS_TIMEZONE), not the server's
 * UTC day — otherwise every rep would read as delinquent from late afternoon
 * onward, which is exactly when this is worth looking at.
 *
 * Activity means a tap or a text appointment, matching what the Activity Feed
 * counts — starting a session without touching anything isn't logging.
 */
export async function getLoggingHealth(): Promise<LoggingHealth> {
  const dayStart = startOfBusinessDay();
  const lookbackStart = subDays(dayStart, LOOKBACK_DAYS);

  const [setters, events, texts] = await Promise.all([
    prisma.user.findMany({
      where: { role: "SETTER", active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.sessionEvent.findMany({
      where: { createdAt: { gte: lookbackStart } },
      select: { createdAt: true, session: { select: { setterId: true } } },
    }),
    prisma.textAppointment.findMany({
      where: { createdAt: { gte: lookbackStart } },
      select: { createdAt: true, setterId: true },
    }),
  ]);

  const lastBySetter = new Map<string, Date>();
  function record(setterId: string, at: Date) {
    const current = lastBySetter.get(setterId);
    if (!current || at > current) lastBySetter.set(setterId, at);
  }
  for (const e of events) record(e.session.setterId, e.createdAt);
  for (const t of texts) record(t.setterId, t.createdAt);

  const lapses: LoggingLapse[] = [];
  let loggedTodayCount = 0;

  for (const setter of setters) {
    const lastLoggedAt = lastBySetter.get(setter.id) ?? null;

    if (lastLoggedAt && lastLoggedAt >= dayStart) {
      loggedTodayCount += 1;
      continue;
    }

    lapses.push({
      setterId: setter.id,
      setterName: setter.name,
      lastLoggedAt,
      daysSinceLastLogged: lastLoggedAt
        ? Math.max(1, Math.ceil((dayStart.getTime() - lastLoggedAt.getTime()) / 86_400_000))
        : null,
    });
  }

  // Longest silence first — a rep six days quiet matters more than one who
  // simply hasn't started yet this morning.
  lapses.sort((a, b) => {
    if (a.daysSinceLastLogged === null) return -1;
    if (b.daysSinceLastLogged === null) return 1;
    return b.daysSinceLastLogged - a.daysSinceLastLogged;
  });

  return { totalSetters: setters.length, loggedTodayCount, lapses };
}
