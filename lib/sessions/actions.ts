"use server";

import { prisma } from "@/lib/db/client";
import { requireActionRole } from "@/lib/auth/guard";
import { writeAuditLog } from "@/lib/audit/log";
import { rebuildAggregateForSession } from "@/lib/aggregation/daily";
import { startSessionSchema, sessionIdSchema, recordEventSchema } from "@/lib/validation/sessions";
import { checkRateLimit } from "@/lib/rate-limit/memory";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

type TappableEventType = "CONVERSATION" | "APPOINTMENT" | "DQ" | "WRONG_NUMBER";
type CounterField = "conversations" | "appointments" | "dq" | "wrongNumber";
type SessionCounts = { conversations: number; appointments: number; dq: number; wrongNumber: number };

function fieldForEventType(type: TappableEventType): CounterField {
  switch (type) {
    case "CONVERSATION":
      return "conversations";
    case "APPOINTMENT":
      return "appointments";
    case "DQ":
      return "dq";
    case "WRONG_NUMBER":
      return "wrongNumber";
  }
}

/** Starts a new calling session. Fails cleanly if the setter already has one active (section 8). */
export async function startSessionAction(input: unknown): Promise<ActionResult<{ sessionId: string }>> {
  const user = await requireActionRole(["SETTER"]);

  const { allowed } = checkRateLimit(`start-session:${user.id}`, { windowMs: 60_000, max: 10 });
  if (!allowed) return { ok: false, error: "Too many attempts. Wait a moment and try again." };

  const parsed = startSessionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Select a valid lead list." };

  const existingActive = await prisma.callingSession.findFirst({
    where: { setterId: user.id, status: "ACTIVE" },
  });
  if (existingActive) {
    return { ok: false, error: "You already have an active session. End it before starting a new one." };
  }

  const leadList = await prisma.leadList.findFirst({
    where: { id: parsed.data.leadListId, status: "ACTIVE" },
  });
  if (!leadList) return { ok: false, error: "That lead list is no longer available." };

  let session;
  try {
    session = await prisma.callingSession.create({
      data: { setterId: user.id, leadListId: leadList.id },
    });
  } catch {
    // DB partial-unique-index backstop against a race with the check above.
    return { ok: false, error: "You already have an active session. End it before starting a new one." };
  }

  await writeAuditLog({
    actorId: user.id,
    action: "SESSION_STARTED",
    entityType: "CallingSession",
    entityId: session.id,
  });

  return { ok: true, data: { sessionId: session.id } };
}

/** Records one conversation/appointment/DQ/wrong-number tap. Returns the authoritative updated counts. */
export async function recordEventAction(input: unknown): Promise<ActionResult<SessionCounts>> {
  const user = await requireActionRole(["SETTER"]);
  const parsed = recordEventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const session = await prisma.callingSession.findFirst({
    where: { id: parsed.data.sessionId, setterId: user.id, status: "ACTIVE" },
  });
  if (!session) return { ok: false, error: "Session not found or already ended." };

  const field = fieldForEventType(parsed.data.type);

  const [updated] = await prisma.$transaction([
    prisma.callingSession.update({
      where: { id: session.id },
      data: { [field]: { increment: 1 } },
    }),
    prisma.sessionEvent.create({
      data: { sessionId: session.id, type: parsed.data.type },
    }),
  ]);

  return {
    ok: true,
    data: {
      conversations: updated.conversations,
      appointments: updated.appointments,
      dq: updated.dq,
      wrongNumber: updated.wrongNumber,
    },
  };
}

/** Undoes the most recent tap for this session, based on the server's own event log — never trusts the client's idea of what to undo. */
export async function undoLastEventAction(
  input: unknown,
): Promise<ActionResult<SessionCounts & { undone: string | null }>> {
  const user = await requireActionRole(["SETTER"]);
  const parsed = sessionIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const session = await prisma.callingSession.findFirst({
    where: { id: parsed.data.sessionId, setterId: user.id, status: "ACTIVE" },
  });
  if (!session) return { ok: false, error: "Session not found or already ended." };

  const lastEvent = await prisma.sessionEvent.findFirst({
    where: { sessionId: session.id, type: { in: ["CONVERSATION", "APPOINTMENT", "DQ", "WRONG_NUMBER"] } },
    orderBy: { createdAt: "desc" },
  });
  if (!lastEvent) return { ok: false, error: "Nothing to undo." };

  const field = fieldForEventType(lastEvent.type as TappableEventType);

  try {
    const [updated] = await prisma.$transaction([
      prisma.callingSession.update({
        where: { id: session.id },
        data: { [field]: { decrement: 1 } },
      }),
      prisma.sessionEvent.delete({ where: { id: lastEvent.id } }),
      prisma.sessionEvent.create({ data: { sessionId: session.id, type: "UNDO" } }),
    ]);

    return {
      ok: true,
      data: {
        conversations: updated.conversations,
        appointments: updated.appointments,
        dq: updated.dq,
        wrongNumber: updated.wrongNumber,
        undone: lastEvent.type,
      },
    };
  } catch {
    return { ok: false, error: "Couldn't undo — counts may already be at zero." };
  }
}

/** Ends the active session and rebuilds its daily aggregate bucket. */
export async function endSessionAction(input: unknown): Promise<ActionResult> {
  const user = await requireActionRole(["SETTER"]);
  const parsed = sessionIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const session = await prisma.callingSession.findFirst({
    where: { id: parsed.data.sessionId, setterId: user.id, status: "ACTIVE" },
  });
  if (!session) return { ok: false, error: "Session not found or already ended." };

  await prisma.callingSession.update({
    where: { id: session.id },
    data: { status: "COMPLETED", endedAt: new Date() },
  });

  await rebuildAggregateForSession({
    setterId: session.setterId,
    leadListId: session.leadListId,
    startedAt: session.startedAt,
  });

  await writeAuditLog({
    actorId: user.id,
    action: "SESSION_ENDED",
    entityType: "CallingSession",
    entityId: session.id,
  });

  return { ok: true, data: undefined };
}
