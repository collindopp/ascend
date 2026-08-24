import "server-only";
import { prisma } from "@/lib/db/client";
import { rebuildAggregateForSession } from "@/lib/aggregation/daily";
import { writeAuditLog } from "@/lib/audit/log";

/**
 * A session with no tap in this long is treated as abandoned — the setter
 * almost certainly closed the app, lost signal, or forgot to end it, rather
 * than genuinely working leads for that whole stretch. Long enough that it
 * never cuts off a real long call or a short break; short enough that a
 * session can't sit open for days skewing "active time" the way the ones
 * discovered on Rep Activity did (see the manual cleanup that prompted
 * this feature).
 */
export const AUTO_CLOSE_IDLE_MINUTES = 60;

/**
 * Closes every ACTIVE session that's gone idle past the threshold, using
 * each session's own last tap (or its start time, if it was never touched
 * at all) as `endedAt` — never "now". Using "now" would inflate that day's
 * duration by however long the session sat open unnoticed, which is
 * exactly the accuracy problem this feature exists to prevent.
 *
 * Called opportunistically from every route-group layout rather than a
 * cron job, so it self-heals on ordinary app traffic without needing extra
 * infrastructure — any page load by anyone sweeps the whole team.
 */
export async function closeStaleActiveSessions(idleMinutes: number = AUTO_CLOSE_IDLE_MINUTES): Promise<void> {
  const sessions = await prisma.callingSession.findMany({ where: { status: "ACTIVE" } });
  if (sessions.length === 0) return;

  const lastEvents = await prisma.sessionEvent.groupBy({
    by: ["sessionId"],
    where: { sessionId: { in: sessions.map((s) => s.id) } },
    _max: { createdAt: true },
  });
  const lastEventMap = new Map(lastEvents.map((e) => [e.sessionId, e._max.createdAt]));

  const now = Date.now();
  const cutoffMs = idleMinutes * 60 * 1000;

  for (const session of sessions) {
    const lastActivity = lastEventMap.get(session.id) ?? session.startedAt;
    if (now - lastActivity.getTime() < cutoffMs) continue;

    await prisma.callingSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED", endedAt: lastActivity },
    });

    await rebuildAggregateForSession({
      setterId: session.setterId,
      leadListId: session.leadListId,
      startedAt: session.startedAt,
    });

    await writeAuditLog({
      actorId: null,
      action: "SESSION_AUTO_CLOSED",
      entityType: "CallingSession",
      entityId: session.id,
      metadata: {
        reason: `No activity for ${idleMinutes}+ minutes`,
        lastActivityAt: lastActivity.toISOString(),
      },
    });
  }
}
