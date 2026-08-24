/**
 * Pure constants shared between server code (lib/analytics/leaderboard.ts)
 * and the client-side live leaderboard component. Deliberately has zero
 * server-only imports (no Prisma, no "server-only") so it's safe to bundle
 * into client JavaScript.
 */
export const LEADERBOARD_KPIS = [
  "appointments",
  "setRate",
  "conversations",
  "appointmentsPerHour",
  "conversationsPerHour",
  "textAppointments",
] as const;
export type LeaderboardKpi = (typeof LEADERBOARD_KPIS)[number];

export const LEADERBOARD_KPI_LABELS: Record<LeaderboardKpi, string> = {
  appointments: "Appointments",
  setRate: "Set Rate",
  conversations: "Conversations",
  appointmentsPerHour: "Appointments / Hour",
  conversationsPerHour: "Conversations / Hour",
  textAppointments: "Text Appointments",
};
