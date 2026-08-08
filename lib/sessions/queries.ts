import "server-only";
import { prisma } from "@/lib/db/client";

export async function getActiveSessionForSetter(setterId: string) {
  return prisma.callingSession.findFirst({
    where: { setterId, status: "ACTIVE" },
    include: { leadList: true },
  });
}

export async function getSessionForSetter(sessionId: string, setterId: string) {
  return prisma.callingSession.findFirst({
    where: { id: sessionId, setterId },
    include: { leadList: true },
  });
}

export async function getSessionHistoryForSetter(setterId: string, limit = 30) {
  return prisma.callingSession.findMany({
    where: { setterId, status: "COMPLETED" },
    include: { leadList: true },
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}
