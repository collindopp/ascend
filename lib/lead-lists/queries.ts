import "server-only";
import { prisma } from "@/lib/db/client";
import { setRateFromConversations, dqRate } from "@/lib/metrics/core";
import { meetsSetRateThreshold } from "@/lib/metrics/thresholds";
import type { Role } from "@/lib/generated/prisma/enums";

export interface LeadListWithStats {
  id: string;
  name: string;
  source: string;
  location: string | null;
  leadCount: number | null;
  setRate: number | null;
  dqRate: number | null;
  hasHistory: boolean;
}

/**
 * Whether `role` may call any active list, or only the ones assigned to them.
 *
 * Admins keep full access: the role is a superset that also tallies its own
 * calls, and gating it would mean assigning the owner to their own lists.
 * Managers never reach this screen at all.
 */
function seesEveryList(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

/**
 * Active lead lists for the "select a lead list" screen, each annotated
 * with historical performance computed from real completed sessions.
 * If a list has no history yet, rate fields are null and the UI must show
 * "—", never a fabricated number (section 6 of the ASCEND spec).
 *
 * Scoped to what `viewer` is allowed to call: a setter sees only lists
 * explicitly assigned to them, so an unassigned list is visible to nobody.
 * This is the display half of the rule — the matching server-side guard on
 * the actions that consume a list lives in canSetterUseLeadList, since a
 * hidden list must also be unusable by id.
 */
export async function getActiveLeadListsWithStats(viewer: {
  id: string;
  role: Role;
}): Promise<LeadListWithStats[]> {
  const lists = await prisma.leadList.findMany({
    where: {
      status: "ACTIVE",
      ...(seesEveryList(viewer.role) ? {} : { assignments: { some: { setterId: viewer.id } } }),
    },
    orderBy: { name: "asc" },
  });

  const totals = await prisma.callingSession.groupBy({
    by: ["leadListId"],
    where: { status: "COMPLETED", leadListId: { in: lists.map((l) => l.id) } },
    _sum: { conversations: true, appointments: true, dq: true, wrongNumber: true },
  });
  const totalsByList = new Map(totals.map((t) => [t.leadListId, t._sum]));

  return lists.map((list) => {
    const sum = totalsByList.get(list.id);
    const conversations = sum?.conversations ?? 0;
    const appointments = sum?.appointments ?? 0;
    const dq = sum?.dq ?? 0;
    const wrongNumber = sum?.wrongNumber ?? 0;
    const outcomesWorked = conversations + dq + wrongNumber;
    const hasEnoughHistory = meetsSetRateThreshold(conversations);

    return {
      id: list.id,
      name: list.name,
      source: list.source,
      location: list.location,
      leadCount: list.leadCount,
      setRate: hasEnoughHistory ? setRateFromConversations(appointments, conversations) : null,
      dqRate: outcomesWorked > 0 ? dqRate(dq, conversations, wrongNumber) : null,
      hasHistory: outcomesWorked > 0,
    };
  });
}

/**
 * Authorization counterpart to the filtering in getActiveLeadListsWithStats.
 * Hiding a list from the picker is presentation only — every action that
 * takes a leadListId must re-check independently, or a setter could still
 * start a session on a restricted list by posting its id (section 28: UI
 * hiding is never the guard).
 */
export async function canSetterUseLeadList(
  viewer: { id: string; role: Role },
  leadListId: string,
): Promise<boolean> {
  if (seesEveryList(viewer.role)) return true;

  const assignment = await prisma.leadListAssignment.findUnique({
    where: { leadListId_setterId: { leadListId, setterId: viewer.id } },
    select: { id: true },
  });
  return assignment !== null;
}
