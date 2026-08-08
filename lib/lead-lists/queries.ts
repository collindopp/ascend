import "server-only";
import { prisma } from "@/lib/db/client";
import { conversionRate, setRateFromConversations } from "@/lib/metrics/core";
import { meetsSetRateThreshold } from "@/lib/metrics/thresholds";

export interface LeadListWithStats {
  id: string;
  name: string;
  source: string;
  location: string | null;
  leadCount: number | null;
  conversionRate: number | null;
  setRate: number | null;
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
    _sum: { dials: true, conversations: true, appointments: true },
  });
  const totalsByList = new Map(totals.map((t) => [t.leadListId, t._sum]));

  return lists.map((list) => {
    const sum = totalsByList.get(list.id);
    const dials = sum?.dials ?? 0;
    const conversations = sum?.conversations ?? 0;
    const appointments = sum?.appointments ?? 0;
    const hasEnoughHistory = meetsSetRateThreshold(conversations);

    return {
      id: list.id,
      name: list.name,
      source: list.source,
      location: list.location,
      leadCount: list.leadCount,
      conversionRate: dials > 0 ? conversionRate(conversations, dials) : null,
      setRate: hasEnoughHistory ? setRateFromConversations(appointments, conversations) : null,
      hasHistory: dials > 0,
    };
  });
}
