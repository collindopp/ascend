"use server";

import { prisma } from "@/lib/db/client";
import { requireActionRole } from "@/lib/auth/guard";
import { rebuildAggregateForTextAppointment } from "@/lib/aggregation/daily";
import { logTextAppointmentSchema } from "@/lib/validation/text-appointments";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import type { ActionResult } from "@/lib/sessions/actions";

/**
 * Logs an appointment set entirely over text — no call, no session, no
 * conversation. Kept out of CallingSession/SessionEvent so it never touches
 * calling metrics (set rate, conversations/hour, etc); it rolls into its own
 * DailyAggregate.textAppointments counter instead.
 */
export async function logTextAppointmentAction(input: unknown): Promise<ActionResult> {
  const user = await requireActionRole(["SETTER", "ADMIN"]);

  const { allowed } = checkRateLimit(`log-text-appt:${user.id}`, { windowMs: 60_000, max: 20 });
  if (!allowed) return { ok: false, error: "Too many attempts. Wait a moment and try again." };

  const parsed = logTextAppointmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Select a valid lead list." };

  const leadList = await prisma.leadList.findFirst({
    where: { id: parsed.data.leadListId, status: "ACTIVE" },
  });
  if (!leadList) return { ok: false, error: "That lead list is no longer available." };

  const entry = await prisma.textAppointment.create({
    data: { setterId: user.id, leadListId: leadList.id, note: parsed.data.note || null },
  });

  await rebuildAggregateForTextAppointment({
    setterId: entry.setterId,
    leadListId: entry.leadListId,
    createdAt: entry.createdAt,
  });

  return { ok: true, data: undefined };
}
