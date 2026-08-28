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
  TEXT_APPOINTMENT: "Text Appointment",
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
  textAppointments: number;
  tapsPerHour: number | null;
  lastActiveAt: Date | null;
}

/** Per-rep rollup for the range: how much they worked, how many actions they logged, and when they were last seen. */
export async function getRepActivitySummary(range: DateRange): Promise<RepActivityRow[]> {
  const sessionRows = await fetchSessionsInRange(range);
  const grouped = groupBy(sessionRows, "setterId");
  const sessionToSetter = new Map(sessionRows.map((r) => [r.id, r.setterId]));

  const [events, textAppointments] = await Promise.all([
    sessionRows.length === 0
      ? Promise.resolve([])
      : prisma.sessionEvent.findMany({
          where: { sessionId: { in: sessionRows.map((r) => r.id) } },
          select: { sessionId: true, type: true, createdAt: true },
        }),
    prisma.textAppointment.findMany({
      where: { createdAt: { gte: range.start, lte: range.end } },
      select: { setterId: true, createdAt: true },
    }),
  ]);

  const perSetter = new Map<string, { taps: number; undos: number; textAppointments: number; lastActiveAt: Date | null }>();
  function bucketFor(setterId: string) {
    const bucket = perSetter.get(setterId) ?? { taps: 0, undos: 0, textAppointments: 0, lastActiveAt: null };
    perSetter.set(setterId, bucket);
    return bucket;
  }
  for (const e of events) {
    const setterId = sessionToSetter.get(e.sessionId);
    if (!setterId) continue;
    const bucket = bucketFor(setterId);
    if (e.type === "UNDO") bucket.undos += 1;
    else bucket.taps += 1;
    if (!bucket.lastActiveAt || e.createdAt > bucket.lastActiveAt) bucket.lastActiveAt = e.createdAt;
  }
  for (const t of textAppointments) {
    const bucket = bucketFor(t.setterId);
    bucket.textAppointments += 1;
    if (!bucket.lastActiveAt || t.createdAt > bucket.lastActiveAt) bucket.lastActiveAt = t.createdAt;
  }

  // A rep who only logged text appointments (no calling sessions in range) wouldn't
  // otherwise appear here, since `grouped` is built from CallingSession rows.
  const allIds = new Set([...grouped.map((g) => g.id), ...perSetter.keys()]);
  const missingIds = [...allIds].filter((id) => !grouped.some((g) => g.id === id));
  const missingSetters = missingIds.length === 0
    ? []
    : await prisma.user.findMany({ where: { id: { in: missingIds } }, select: { id: true, name: true } });

  const rows: RepActivityRow[] = grouped.map((g) => {
    const activity = perSetter.get(g.id) ?? { taps: 0, undos: 0, textAppointments: 0, lastActiveAt: null };
    return {
      id: g.id,
      name: g.name,
      sessionsCount: g.sessionsCount,
      durationSeconds: g.durationSeconds,
      taps: activity.taps,
      undos: activity.undos,
      textAppointments: activity.textAppointments,
      tapsPerHour: g.durationSeconds > 0 ? (activity.taps / g.durationSeconds) * 3600 : null,
      lastActiveAt: activity.lastActiveAt,
    };
  });
  for (const setter of missingSetters) {
    const activity = perSetter.get(setter.id) ?? { taps: 0, undos: 0, textAppointments: 0, lastActiveAt: null };
    rows.push({
      id: setter.id,
      name: setter.name,
      sessionsCount: 0,
      durationSeconds: 0,
      taps: 0,
      undos: 0,
      textAppointments: activity.textAppointments,
      tapsPerHour: null,
      lastActiveAt: activity.lastActiveAt,
    });
  }

  return rows.sort((a, b) => b.taps - a.taps);
}

export interface ActivityFeedFilters {
  range: DateRange;
  setterId?: string;
  page: number;
  pageSize: number;
}

function buildEventWhere(filters: Pick<ActivityFeedFilters, "range" | "setterId">) {
  return {
    createdAt: { gte: filters.range.start, lte: filters.range.end },
    ...(filters.setterId ? { session: { setterId: filters.setterId } } : {}),
  };
}

function buildTextWhere(filters: Pick<ActivityFeedFilters, "range" | "setterId">) {
  return {
    createdAt: { gte: filters.range.start, lte: filters.range.end },
    ...(filters.setterId ? { setterId: filters.setterId } : {}),
  };
}

export interface ActivityFeedRow {
  id: string;
  type: string;
  createdAt: Date;
  setterId: string;
  setterName: string;
  leadListName: string;
  sessionId: string | null;
  note: string | null;
}

function mapEventRow(e: {
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
    note: null,
  };
}

function mapTextRow(t: {
  id: string;
  createdAt: Date;
  note: string | null;
  setter: { id: string; name: string };
  leadList: { name: string };
}): ActivityFeedRow {
  return {
    id: t.id,
    type: "TEXT_APPOINTMENT",
    createdAt: t.createdAt,
    setterId: t.setter.id,
    setterName: t.setter.name,
    leadListName: t.leadList.name,
    sessionId: null,
    note: t.note,
  };
}

const eventInclude = {
  session: {
    select: { id: true, setter: { select: { id: true, name: true } }, leadList: { select: { name: true } } },
  },
} as const;

const textInclude = {
  setter: { select: { id: true, name: true } },
  leadList: { select: { name: true } },
} as const;

/**
 * Two independent tables can't be paginated by a single SQL query, so the
 * page is assembled by merging both in memory. The merge only ever needs the
 * top `offset + pageSize` rows from each source — anything deeper than that
 * in one table cannot place inside the requested window no matter how the
 * two interleave — so that's the exact depth fetched, rather than pulling
 * everything and slicing.
 *
 * Counts come from dedicated COUNT queries instead of the merged length:
 * cheap on the `createdAt` indexes, and correct regardless of how many rows
 * were actually materialized for the page.
 */
export async function getActivityFeed(filters: ActivityFeedFilters) {
  const eventWhere = buildEventWhere(filters);
  const textWhere = buildTextWhere(filters);
  const depth = filters.page * filters.pageSize;

  const [events, texts, eventCount, textCount] = await Promise.all([
    prisma.sessionEvent.findMany({
      where: eventWhere,
      include: eventInclude,
      orderBy: { createdAt: "desc" },
      take: depth,
    }),
    prisma.textAppointment.findMany({
      where: textWhere,
      include: textInclude,
      orderBy: { createdAt: "desc" },
      take: depth,
    }),
    prisma.sessionEvent.count({ where: eventWhere }),
    prisma.textAppointment.count({ where: textWhere }),
  ]);

  const merged = [...events.map(mapEventRow), ...texts.map(mapTextRow)].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const total = eventCount + textCount;
  const start = (filters.page - 1) * filters.pageSize;
  const rows = merged.slice(start, start + filters.pageSize);

  return {
    rows,
    total,
    pageCount: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

const EXPORT_ROW_CAP = 20_000;

/** Unpaginated — for CSV export, capped well above any realistic internal-team volume. */
export async function getActivityFeedForExport(filters: Pick<ActivityFeedFilters, "range" | "setterId">) {
  const [events, texts] = await Promise.all([
    prisma.sessionEvent.findMany({
      where: buildEventWhere(filters),
      include: eventInclude,
      orderBy: { createdAt: "desc" },
      take: EXPORT_ROW_CAP,
    }),
    prisma.textAppointment.findMany({
      where: buildTextWhere(filters),
      include: textInclude,
      orderBy: { createdAt: "desc" },
      take: EXPORT_ROW_CAP,
    }),
  ]);

  return [...events.map(mapEventRow), ...texts.map(mapTextRow)].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}
