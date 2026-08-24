import "server-only";
import { subDays, startOfDay, format } from "date-fns";
import { prisma } from "@/lib/db/client";

const SPARKLINE_DAYS = 7;

function buildDayKeys(): string[] {
  const keys: string[] = [];
  for (let i = SPARKLINE_DAYS - 1; i >= 0; i--) {
    keys.push(format(startOfDay(subDays(new Date(), i)), "yyyy-MM-dd"));
  }
  return keys;
}

function buildSparklineMap(rows: { id: string; date: Date; value: number }[]): Map<string, number[]> {
  const dayKeys = buildDayKeys();
  const perEntity = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const key = format(r.date, "yyyy-MM-dd");
    const bucket = perEntity.get(r.id) ?? new Map<string, number>();
    bucket.set(key, (bucket.get(key) ?? 0) + r.value);
    perEntity.set(r.id, bucket);
  }
  const result = new Map<string, number[]>();
  for (const [id, bucket] of perEntity) {
    result.set(id, dayKeys.map((k) => bucket.get(k) ?? 0));
  }
  return result;
}

export const EMPTY_SPARKLINE: number[] = new Array(SPARKLINE_DAYS).fill(0);

/**
 * Fixed 7-day appointments trend, independent of whatever date-range filter
 * the page has selected — same "fixed recent window" pattern already used
 * for the 30-day trend charts elsewhere (getSetterDetail, getLeadListDetail).
 */
export async function fetchSetterSparklines(): Promise<Map<string, number[]>> {
  const since = startOfDay(subDays(new Date(), SPARKLINE_DAYS - 1));
  const rows = await prisma.dailyAggregate.findMany({
    where: { date: { gte: since } },
    select: { setterId: true, date: true, appointments: true },
  });
  return buildSparklineMap(rows.map((r) => ({ id: r.setterId, date: r.date, value: r.appointments })));
}

export async function fetchLeadListSparklines(): Promise<Map<string, number[]>> {
  const since = startOfDay(subDays(new Date(), SPARKLINE_DAYS - 1));
  const rows = await prisma.dailyAggregate.findMany({
    where: { date: { gte: since } },
    select: { leadListId: true, date: true, appointments: true },
  });
  return buildSparklineMap(rows.map((r) => ({ id: r.leadListId, date: r.date, value: r.appointments })));
}
