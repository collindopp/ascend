import "server-only";
import { fetchSessionsInRange, groupBy } from "@/lib/analytics/queries";
import { getYesterdayZeroActivitySetters } from "@/lib/analytics/time-worked";
import { previousPeriod, type DateRange } from "@/lib/utils/date-range";
import { generateInsights, type Insight } from "@/lib/insights";
import { sumTotals } from "@/lib/metrics/core";

export async function getOverviewInsights(range: DateRange, periodLabel: string): Promise<Insight[]> {
  const [currentRows, previousRows, zeroActivitySetters] = await Promise.all([
    fetchSessionsInRange(range),
    fetchSessionsInRange(previousPeriod(range)),
    getYesterdayZeroActivitySetters(),
  ]);

  const leadLists = groupBy(currentRows, "leadListId");
  const setters = groupBy(currentRows, "setterId");
  const current = sumTotals(currentRows);
  const previous = sumTotals(previousRows);

  return generateInsights({ leadLists, setters, current, previous, periodLabel, zeroActivitySetters });
}
