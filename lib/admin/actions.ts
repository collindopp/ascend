"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { requireActionRole } from "@/lib/auth/guard";
import { writeAuditLog } from "@/lib/audit/log";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import {
  createUserSchema,
  updateUserSchema,
  createTeamSchema,
  createLeadListSchema,
  updateLeadListStatusSchema,
  setLeadListAssignmentsSchema,
  upsertSystemSettingSchema,
} from "@/lib/validation/admin";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function createUserAction(input: unknown): Promise<ActionResult> {
  const actor = await requireActionRole(["ADMIN"]);

  const { allowed } = checkRateLimit(`create-user:${actor.id}`, { windowMs: 60_000, max: 20 });
  if (!allowed) return { ok: false, error: "Too many attempts. Wait a moment and try again." };

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields and try again." };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) return { ok: false, error: "A user with that email already exists." };

  const passwordHash = await hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      teamId: parsed.data.teamId || null,
    },
  });

  await writeAuditLog({
    actorId: actor.id,
    action: "USER_CREATED",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
  });

  revalidatePath("/admin/users");
  return { ok: true, data: undefined };
}

export async function updateUserAction(input: unknown): Promise<ActionResult> {
  const actor = await requireActionRole(["ADMIN"]);
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const { userId, ...changes } = parsed.data;
  if (userId === actor.id && changes.active === false) {
    return { ok: false, error: "You can't deactivate your own account." };
  }
  if (userId === actor.id && changes.role && changes.role !== "ADMIN") {
    return { ok: false, error: "You can't change your own role away from admin." };
  }

  const user = await prisma.user.update({ where: { id: userId }, data: changes });

  await writeAuditLog({
    actorId: actor.id,
    action: "USER_UPDATED",
    entityType: "User",
    entityId: user.id,
    metadata: changes,
  });

  revalidatePath("/admin/users");
  return { ok: true, data: undefined };
}

export async function createTeamAction(input: unknown): Promise<ActionResult> {
  const actor = await requireActionRole(["ADMIN"]);
  const parsed = createTeamSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a team name." };

  const existing = await prisma.team.findUnique({ where: { name: parsed.data.name } });
  if (existing) return { ok: false, error: "A team with that name already exists." };

  const team = await prisma.team.create({ data: { name: parsed.data.name } });

  await writeAuditLog({ actorId: actor.id, action: "TEAM_CREATED", entityType: "Team", entityId: team.id });

  revalidatePath("/admin/teams");
  return { ok: true, data: undefined };
}

export async function createLeadListAction(input: unknown): Promise<ActionResult> {
  const actor = await requireActionRole(["ADMIN", "MANAGER"]);
  const parsed = createLeadListSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields and try again." };

  const tags = parsed.data.tags
    ? parsed.data.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const leadList = await prisma.leadList.create({
    data: {
      name: parsed.data.name,
      source: parsed.data.source,
      location: parsed.data.location || null,
      description: parsed.data.description || null,
      leadCount: parsed.data.leadCount ?? null,
      externalId: parsed.data.externalId || null,
      tags,
      createdById: actor.id,
    },
  });

  await writeAuditLog({
    actorId: actor.id,
    action: "LEAD_LIST_CREATED",
    entityType: "LeadList",
    entityId: leadList.id,
    metadata: { name: leadList.name },
  });

  revalidatePath("/admin/lead-lists");
  return { ok: true, data: undefined };
}

export async function updateLeadListStatusAction(input: unknown): Promise<ActionResult> {
  const actor = await requireActionRole(["ADMIN", "MANAGER"]);
  const parsed = updateLeadListStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const leadList = await prisma.leadList.update({
    where: { id: parsed.data.leadListId },
    data: { status: parsed.data.status },
  });

  await writeAuditLog({
    actorId: actor.id,
    action: "LEAD_LIST_STATUS_CHANGED",
    entityType: "LeadList",
    entityId: leadList.id,
    metadata: { status: leadList.status },
  });

  revalidatePath("/admin/lead-lists");
  return { ok: true, data: undefined };
}

/**
 * Replaces a list's assignment set wholesale — the modal always submits the
 * full intended roster, so reconciling to it is simpler and more predictable
 * than diffing adds and removes on the client.
 *
 * Only affects who may *call* the list going forward. Sessions already worked
 * on it keep their history and stay visible in every manager report, so
 * unassigning someone never rewrites what they've already done.
 */
export async function setLeadListAssignmentsAction(input: unknown): Promise<ActionResult> {
  const actor = await requireActionRole(["ADMIN", "MANAGER"]);
  const parsed = setLeadListAssignmentsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const leadList = await prisma.leadList.findUnique({ where: { id: parsed.data.leadListId } });
  if (!leadList) return { ok: false, error: "Lead list not found." };

  // Ignore ids that aren't currently assignable setters, so a stale form
  // can't create assignments for deactivated or non-setter accounts.
  const setterIds = [...new Set(parsed.data.setterIds)];
  const valid = await prisma.user.findMany({
    where: { id: { in: setterIds }, role: "SETTER", active: true },
    select: { id: true },
  });
  const validIds = valid.map((v) => v.id);

  await prisma.$transaction([
    // Drop whoever is no longer selected. With an empty selection there's no
    // exclusion to apply, so every assignment for the list goes.
    prisma.leadListAssignment.deleteMany({
      where: {
        leadListId: leadList.id,
        ...(validIds.length > 0 ? { setterId: { notIn: validIds } } : {}),
      },
    }),
    prisma.leadListAssignment.createMany({
      data: validIds.map((setterId) => ({ leadListId: leadList.id, setterId })),
      skipDuplicates: true,
    }),
  ]);

  await writeAuditLog({
    actorId: actor.id,
    action: "LEAD_LIST_ASSIGNMENTS_CHANGED",
    entityType: "LeadList",
    entityId: leadList.id,
    metadata: { name: leadList.name, assignedCount: validIds.length },
  });

  revalidatePath("/admin/lead-lists");
  return { ok: true, data: undefined };
}

export async function upsertSystemSettingAction(input: unknown): Promise<ActionResult> {
  const actor = await requireActionRole(["ADMIN"]);
  const parsed = upsertSystemSettingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter both a key and a value." };

  await prisma.systemSetting.upsert({
    where: { key: parsed.data.key },
    update: { value: parsed.data.value },
    create: { key: parsed.data.key, value: parsed.data.value },
  });

  await writeAuditLog({
    actorId: actor.id,
    action: "SYSTEM_SETTING_CHANGED",
    entityType: "SystemSetting",
    entityId: parsed.data.key,
  });

  revalidatePath("/admin/settings");
  return { ok: true, data: undefined };
}
