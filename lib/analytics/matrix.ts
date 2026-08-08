import "server-only";
import { prisma } from "@/lib/db/client";
import { conversionRate, setRateFromConversations, perHour } from "@/lib/metrics/core";
import { meetsSetRateThreshold, meetsConversionRateThreshold, meetsHourlyRankingThreshold } from "@/lib/metrics/thresholds";
import { fetchSessionsInRange, groupByCell } from "@/lib/analytics/queries";
import type { DateRange } from "@/lib/utils/date-range";

export const MATRIX_KPIS = [
  "setRate",
  "conversionRate",
  "appointments",
  "appointmentsPerHour",
  "dialsPerHour",
  "conversationsPerHour",
] as const;
export type MatrixKpi = (typeof MATRIX_KPIS)[number];

export const MATRIX_KPI_LABELS: Record<MatrixKpi, string> = {
  setRate: "Set Rate",
  conversionRate: "Conversation Rate",
  appointments: "Appointments",
  appointmentsPerHour: "Appointments / Hour",
  dialsPerHour: "Dials / Hour",
  conversationsPerHour: "Conversations / Hour",
};

function cellValue(kpi: MatrixKpi, cell: { dials: number; conversations: number; appointments: number; durationSeconds: number }) {
  switch (kpi) {
    case "setRate":
      return meetsSetRateThreshold(cell.conversations) ? setRateFromConversations(cell.appointments, cell.conversations) : null;
    case "conversionRate":
      return meetsConversionRateThreshold(cell.dials) ? conversionRate(cell.conversations, cell.dials) : null;
    case "appointments":
      return cell.appointments;
    case "appointmentsPerHour":
      return meetsHourlyRankingThreshold(cell.dials) ? perHour(cell.appointments, cell.durationSeconds) : null;
    case "dialsPerHour":
      return meetsHourlyRankingThreshold(cell.dials) ? perHour(cell.dials, cell.durationSeconds) : null;
    case "conversationsPerHour":
      return meetsHourlyRankingThreshold(cell.dials) ? perHour(cell.conversations, cell.durationSeconds) : null;
  }
}

export async function getMatrixData(range: DateRange, kpi: MatrixKpi) {
  const rows = await fetchSessionsInRange(range);
  const cells = groupByCell(rows);

  const setters = await prisma.user.findMany({
    where: { role: "SETTER", active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const leadLists = await prisma.leadList.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });

  const cellMap = new Map(cells.map((c) => [`${c.setterId}:${c.leadListId}`, c]));

  const grid = leadLists.map((leadList) => ({
    leadListId: leadList.id,
    leadListName: leadList.name,
    values: setters.map((setter) => {
      const cell = cellMap.get(`${setter.id}:${leadList.id}`);
      const value = cell ? cellValue(kpi, cell) : null;
      return { setterId: setter.id, value };
    }),
  }));

  return {
    setters: setters.map((s) => ({ id: s.id, name: s.name })),
    grid,
  };
}
