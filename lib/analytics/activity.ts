import "server-only";
import { prisma } from "@/lib/db/client";
import { fetchSessionsInRange, groupBy } from "@/lib/analytics/queries";
import type { DateRange } from "@/lib/utils/date-range";

/** A session with no tap in this many minutes is flagged idle — active but not actually being worked. */
export const IDLE_THRESHOLD_MINUTES = 10;

export const EVENT_TYPE_LABELS: Record<string, string> = {
  DIAL: "Dial",
  CONVERSATION: "Conversation",
  APPOINTMENT: "Appointment",
  DQ: "DQ",
  WRONG_NUMBER: "Wrong Name/Number",
  PICK_UP: "Pick Up",
  NOT_INTERESTED: "Not Interested",
  FOLLOW_UP: "Follow Up",
  UNDO: "Undo",
};

export interface ActiveNowRow {
  sessionId: string;
  setterId: string;
  setterName: string;
  leadListName: string;
  startedAt: Date;
  durationSeconds: number;
  lastEventAt: Date | null;
  idleMinutes: number;
  isIdle: boolean;
  conversations: number;
  appointments: number;
}

/** Every session currently open, with time-since-last-tap so a manager can spot who's actually working it. */
export async function getActiveNow(): Promise<ActiveNowRow[]> {
  const sessions = await prisma.callingSession.findMany({
    where: { status: "ACTIVE" },
    include: {
      setter: { select: { id: true, name: true } },
      leadList: { select: { name: true } },
    },
    orderBy: { startedAt: "asc" },
  });
  if (sessions.length === 0) return [];

  const lastEvents = await prisma.sessionEvent.groupBy({
    by: ["sessionId"],
    where: { sessionId: { in: sessions.map((s) => s.id) } },
    _max: { createdAt: true },
  });
  const lastEventMap = new Map(lastEvents.map((e) => [e.sessionId, e._max.createdAt]));

  const now = Date.now();
  return sessions.map((s) => {
    const lastEventAt = lastEventMap.get(s.id) ?? null;
    const idleMinutes = Math.floor((now - (lastEventAt ?? s.startedAt).getTime()) / 60000);
    return {
      sessionId: s.id,
      setterId: s.setterId,
      setterName: s.setter.name,
      leadListName: s.leadList.name,
      startedAt: s.startedAt,
      durationSeconds: Math.max(0, Math.round((now - s.startedAt.getTime()) / 1000)),
      lastEventAt,
      idleMinutes,
      isIdle: idleMinutes >= IDLE_THRESHOLD_MINUTES,
      conversations: s.conversations,
      appointments: s.appointments,
    };
  });
}

export interface RepActivityRow {
  id: string;
  name: string;
  sessionsCount: number;
  durationSeconds: number;
  taps: number;
  undos: number;
  tapsPerHour: number | null;
  lastActiveAt: Date | null;
}

/** Per-rep rollup for the range: how much they worked, how many actions they logged, and when they were last seen. */
export async function getRepActivitySummary(range: DateRange): Promise<RepActivityRow[]> {
  const sessionRows = await fetchSessionsInRange(range);
  const grouped = groupBy(sessionRows, "setterId");
  const sessionToSetter = new Map(sessionRows.map((r) => [r.id, r.setterId]));

  const events =
    sessionRows.length === 0
      ? []
      : await prisma.sessionEvent.findMany({
          where: { sessionId: { in: sessionRows.map((r) => r.id) } },
          select: { sessionId: true, type: true, createdAt: true },
        });

  const perSetter = new Map<string, { taps: number; undos: number; lastActiveAt: Date | null }>();
  for (const e of events) {
    const setterId = sessionToSetter.get(e.sessionId);
    if (!setterId) continue;
    const bucket = perSetter.get(setterId) ?? { taps: 0, undos: 0, lastActiveAt: null };
    if (e.type === "UNDO") bucket.undos += 1;
    else bucket.taps += 1;
    if (!bucket.lastActiveAt || e.createdAt > bucket.lastActiveAt) bucket.lastActiveAt = e.createdAt;
    perSetter.set(setterId, bucket);
  }

  return grouped
    .map((g) => {
      const activity = perSetter.get(g.id) ?? { taps: 0, undos: 0, lastActiveAt: null };
      return {
        id: g.id,
        name: g.name,
        sessionsCount: g.sessionsCount,
        durationSeconds: g.durationSeconds,
        taps: activity.taps,
        undos: activity.undos,
        tapsPerHour: g.durationSeconds > 0 ? (activity.taps / g.durationSeconds) * 3600 : null,
        lastActiveAt: activity.lastActiveAt,
      };
    })
    .sort((a, b) => b.taps - a.taps);
}

export interface ActivityFeedFilters {
  range: DateRange;
  setterId?: string;
  page: number;
  pageSize: number;
}

function buildFeedWhere(filters: Pick<ActivityFeedFilters, "range" | "setterId">) {
  return {
    createdAt: { gte: filters.range.start, lte: filters.range.end },
    ...(filters.setterId ? { session: { setterId: filters.setterId } } : {}),
  };
}

export interface ActivityFeedRow {
  id: string;
  type: string;
  createdAt: Date;
  setterId: string;
  setterName: string;
  leadListName: string;
  sessionId: string;
}

function mapFeedRow(e: {
  id: string;
  type: string;
  createdAt: Date;
  session: { id: string; setter: { id: string; name: string }; leadList: { name: string } };
}): ActivityFeedRow {
  return {
    id: e.id,
    type: e.type,
    createdAt: e.createdAt,
    setterId: e.session.setter.id,
    setterName: e.session.setter.name,
    leadListName: e.session.leadList.name,
    sessionId: e.session.id,
  };
}

export async function getActivityFeed(filters: ActivityFeedFilters) {
  const where = buildFeedWhere(filters);

  const [rows, total] = await Promise.all([
    prisma.sessionEvent.findMany({
      where,
      include: {
        session: {
          select: { id: true, setter: { select: { id: true, name: true } }, leadList: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.sessionEvent.count({ where }),
  ]);

  return {
    rows: rows.map(mapFeedRow),
    total,
    pageCount: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

const EXPORT_ROW_CAP = 20_000;

/** Unpaginated — for CSV export, capped well above any realistic internal-team volume. */
export async function getActivityFeedForExport(filters: Pick<ActivityFeedFilters, "range" | "setterId">) {
  const rows = await prisma.sessionEvent.findMany({
    where: buildFeedWhere(filters),
    include: {
      session: {
        select: { id: true, setter: { select: { id: true, name: true } }, leadList: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: EXPORT_ROW_CAP,
  });
  return rows.map(mapFeedRow);
}
