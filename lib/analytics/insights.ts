import "server-only";
import { fetchSessionsInRange, groupBy } from "@/lib/analytics/queries";
import { previousPeriod, type DateRange } from "@/lib/utils/date-range";
import { generateInsights, type Insight } from "@/lib/insights";
import { sumTotals } from "@/lib/metrics/core";

/**
 * Insights are analytical observations about performance. Who is and isn't
 * logging is a separate, operational question that now has its own alert on
 * the Overview page — one entry per quiet rep used to crowd everything else
 * out of this list.
 */
export async function getOverviewInsights(range: DateRange, periodLabel: string): Promise<Insight[]> {
  const [currentRows, previousRows] = await Promise.all([
    fetchSessionsInRange(range),
    fetchSessionsInRange(previousPeriod(range)),
  ]);

  const leadLists = groupBy(currentRows, "leadListId");
  const setters = groupBy(currentRows, "setterId");
  const current = sumTotals(currentRows);
  const previous = sumTotals(previousRows);

  return generateInsights({ leadLists, setters, current, previous, periodLabel });
}
