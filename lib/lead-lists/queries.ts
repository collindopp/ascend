import "server-only";
import { prisma } from "@/lib/db/client";
import { setRateFromConversations, dqRate } from "@/lib/metrics/core";
import { meetsSetRateThreshold } from "@/lib/metrics/thresholds";

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
 * Active lead lists for the "select a lead list" screen, each annotated
 * with historical performance computed from real completed sessions.
 * If a list has no history yet, rate fields are null and the UI must show
 * "—", never a fabricated number (section 6 of the ASCEND spec).
 */
export async function getActiveLeadListsWithStats(): Promise<LeadListWithStats[]> {
  const lists = await prisma.leadList.findMany({
    where: { status: "ACTIVE" },
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
