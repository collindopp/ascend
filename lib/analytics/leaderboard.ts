import "server-only";
import { getSetterRows } from "@/lib/analytics/setters";
import { meetsSetRateThreshold, meetsHourlyRankingThreshold } from "@/lib/metrics/thresholds";
import type { DateRange } from "@/lib/utils/date-range";

export const LEADERBOARD_KPIS = ["appointments", "setRate", "conversations", "dials", "appointmentsPerHour", "conversationsPerHour"] as const;
export type LeaderboardKpi = (typeof LEADERBOARD_KPIS)[number];

export const LEADERBOARD_KPI_LABELS: Record<LeaderboardKpi, string> = {
  appointments: "Appointments",
  setRate: "Set Rate",
  conversations: "Conversations",
  dials: "Dials",
  appointmentsPerHour: "Appointments / Hour",
  conversationsPerHour: "Conversations / Hour",
};

function rankValue(kpi: LeaderboardKpi, row: Awaited<ReturnType<typeof getSetterRows>>[number]): number | null {
  switch (kpi) {
    case "appointments":
      return row.appointments;
    case "conversations":
      return row.conversations;
    case "dials":
      return row.dials;
    case "setRate":
      return meetsSetRateThreshold(row.conversations) ? row.metrics.setRateFromConversations : null;
    case "appointmentsPerHour":
      return meetsHourlyRankingThreshold(row.dials) ? row.metrics.appointmentsPerHour : null;
    case "conversationsPerHour":
      return meetsHourlyRankingThreshold(row.dials) ? row.metrics.conversationsPerHour : null;
  }
}

export async function getLeaderboardRows(range: DateRange, kpi: LeaderboardKpi) {
  const rows = await getSetterRows(range);
  return rows
    .map((row) => ({ ...row, rankValue: rankValue(kpi, row) }))
    .sort((a, b) => {
      if (a.rankValue === null && b.rankValue === null) return 0;
      if (a.rankValue === null) return 1;
      if (b.rankValue === null) return -1;
      return b.rankValue - a.rankValue;
    });
}
