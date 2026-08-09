import "server-only";
import { prisma } from "@/lib/db/client";
import { setRateFromConversations, perHour, dqRate, wrongNumberRate } from "@/lib/metrics/core";
import { meetsSetRateThreshold, meetsHourlyRankingThreshold, meetsQualityRankingThreshold } from "@/lib/metrics/thresholds";
import { fetchSessionsInRange, groupByCell } from "@/lib/analytics/queries";
import type { DateRange } from "@/lib/utils/date-range";

export const MATRIX_KPIS = [
  "setRate",
  "appointments",
  "appointmentsPerHour",
  "conversationsPerHour",
  "dqRate",
  "wrongNumberRate",
] as const;
export type MatrixKpi = (typeof MATRIX_KPIS)[number];

export const MATRIX_KPI_LABELS: Record<MatrixKpi, string> = {
  setRate: "Set Rate",
  appointments: "Appointments",
  appointmentsPerHour: "Appointments / Hour",
  conversationsPerHour: "Conversations / Hour",
  dqRate: "DQ Rate",
  wrongNumberRate: "Wrong # Rate",
};

// KPIs where a higher value is worse (data-quality problems), not better —
// these get colored on the danger scale instead of the accent scale.
export const MATRIX_INVERSE_KPIS: ReadonlySet<MatrixKpi> = new Set(["dqRate", "wrongNumberRate"]);

interface Cell {
  conversations: number;
  appointments: number;
  dq: number;
  wrongNumber: number;
  durationSeconds: number;
}

function cellValue(kpi: MatrixKpi, cell: Cell) {
  switch (kpi) {
    case "setRate":
      return meetsSetRateThreshold(cell.conversations) ? setRateFromConversations(cell.appointments, cell.conversations) : null;
    case "appointments":
      return cell.appointments;
    case "appointmentsPerHour":
      return meetsHourlyRankingThreshold(cell.durationSeconds) ? perHour(cell.appointments, cell.durationSeconds) : null;
    case "conversationsPerHour":
      return meetsHourlyRankingThreshold(cell.durationSeconds) ? perHour(cell.conversations, cell.durationSeconds) : null;
    case "dqRate":
      return meetsQualityRankingThreshold(cell.conversations, cell.dq, cell.wrongNumber)
        ? dqRate(cell.dq, cell.conversations, cell.wrongNumber)
        : null;
    case "wrongNumberRate":
      return meetsQualityRankingThreshold(cell.conversations, cell.dq, cell.wrongNumber)
        ? wrongNumberRate(cell.wrongNumber, cell.conversations, cell.dq)
        : null;
  }
}

export async function getMatrixData(range: DateRange, kpi: MatrixKpi) {
  const rows = await fetchSessionsInRange(range);
  const cells = groupByCell(rows);

  // Admins can tally their own calls too (see the (setter) layout), so they
  // need a column here as well — not just plain SETTER accounts.
  const setters = await prisma.user.findMany({
    where: { role: { in: ["SETTER", "ADMIN"] }, active: true },
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
