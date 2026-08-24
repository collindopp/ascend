import "server-only";
import { getSetterRows } from "@/lib/analytics/setters";
import { meetsSetRateThreshold, meetsHourlyRankingThreshold } from "@/lib/metrics/thresholds";
import type { DateRange } from "@/lib/utils/date-range";
import type { LeaderboardKpi } from "@/lib/analytics/leaderboard-kpis";

export { LEADERBOARD_KPIS, LEADERBOARD_KPI_LABELS, type LeaderboardKpi } from "@/lib/analytics/leaderboard-kpis";

function rankValue(kpi: LeaderboardKpi, row: Awaited<ReturnType<typeof getSetterRows>>[number]): number | null {
  switch (kpi) {
    case "appointments":
      return row.appointments;
    case "conversations":
      return row.conversations;
    case "setRate":
      return meetsSetRateThreshold(row.conversations) ? row.metrics.setRateFromConversations : null;
    case "appointmentsPerHour":
      return meetsHourlyRankingThreshold(row.durationSeconds) ? row.metrics.appointmentsPerHour : null;
    case "conversationsPerHour":
      return meetsHourlyRankingThreshold(row.durationSeconds) ? row.metrics.conversationsPerHour : null;
    case "textAppointments":
      return row.textAppointments;
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
