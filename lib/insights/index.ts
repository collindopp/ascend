import { conversionRate, setRateFromConversations, perHour, type RawTotals } from "@/lib/metrics/core";
import {
  meetsSetRateThreshold,
  meetsConversionRateThreshold,
  MIN_APPOINTMENTS_FOR_RATE_INSIGHT,
} from "@/lib/metrics/thresholds";

export interface Insight {
  id: string;
  text: string;
}

export interface NamedTotals extends RawTotals {
  id: string;
  name: string;
}

const RELATIVE_DIFF_THRESHOLD = 0.15; // only surface a comparison if it's at least 15% off the average

/**
 * "<Lead list> currently has the highest set rate across the team."
 * Only considers lists that clear the sample-size threshold — see thresholds.ts.
 */
export function topLeadListBySetRate(lists: NamedTotals[]): Insight | null {
  const eligible = lists
    .filter((l) => meetsSetRateThreshold(l.conversations))
    .map((l) => ({ ...l, rate: setRateFromConversations(l.appointments, l.conversations) }))
    .filter((l): l is NamedTotals & { rate: number } => l.rate !== null)
    .sort((a, b) => b.rate - a.rate);

  const top = eligible[0];
  if (!top) return null;

  return {
    id: `top-lead-list-set-rate:${top.id}`,
    text: `${top.name} currently has the highest set rate across the team (${top.rate.toFixed(1)}%).`,
  };
}

/**
 * "<Setter> is converting N% above the team average."
 * Compares each setter's conversion rate to the team average, only for
 * setters with enough dials to be meaningful, and only when the gap is
 * large enough to be worth surfacing.
 */
export function settersAboveTeamAverage(setters: NamedTotals[]): Insight[] {
  const teamTotals = setters.reduce<RawTotals>(
    (acc, s) => ({
      dials: acc.dials + s.dials,
      conversations: acc.conversations + s.conversations,
      appointments: acc.appointments + s.appointments,
      durationSeconds: acc.durationSeconds + s.durationSeconds,
    }),
    { dials: 0, conversations: 0, appointments: 0, durationSeconds: 0 },
  );
  const teamRate = conversionRate(teamTotals.conversations, teamTotals.dials);
  if (teamRate === null || teamRate === 0) return [];

  const insights: Insight[] = [];
  for (const setter of setters) {
    if (!meetsConversionRateThreshold(setter.dials)) continue;
    const rate = conversionRate(setter.conversations, setter.dials);
    if (rate === null) continue;

    const relativeDiff = (rate - teamRate) / teamRate;
    if (relativeDiff >= RELATIVE_DIFF_THRESHOLD) {
      insights.push({
        id: `setter-above-average:${setter.id}`,
        text: `${setter.name} is converting ${(relativeDiff * 100).toFixed(0)}% above the team average.`,
      });
    }
  }
  return insights;
}

/**
 * "<Lead list> is producing N% more conversations per 100 dials than the team average."
 */
export function leadListsAboveTeamAverage(lists: NamedTotals[]): Insight[] {
  const teamTotals = lists.reduce<RawTotals>(
    (acc, l) => ({
      dials: acc.dials + l.dials,
      conversations: acc.conversations + l.conversations,
      appointments: acc.appointments + l.appointments,
      durationSeconds: acc.durationSeconds + l.durationSeconds,
    }),
    { dials: 0, conversations: 0, appointments: 0, durationSeconds: 0 },
  );
  const teamRate = conversionRate(teamTotals.conversations, teamTotals.dials);
  if (teamRate === null || teamRate === 0) return [];

  const insights: Insight[] = [];
  for (const list of lists) {
    if (!meetsConversionRateThreshold(list.dials)) continue;
    const rate = conversionRate(list.conversations, list.dials);
    if (rate === null) continue;

    const relativeDiff = (rate - teamRate) / teamRate;
    if (relativeDiff >= RELATIVE_DIFF_THRESHOLD) {
      insights.push({
        id: `lead-list-above-average:${list.id}`,
        text: `${list.name} is producing ${(relativeDiff * 100).toFixed(0)}% more conversations per 100 dials than the team average.`,
      });
    }
  }
  return insights;
}

/**
 * "Team appointment volume increased N% this week."
 * Only fires when both periods have enough appointments to make a percent
 * change meaningful (avoids "increased 300%" off a base of 1).
 */
export function periodOverPeriodChange(
  current: { appointments: number },
  previous: { appointments: number },
  label: string,
): Insight | null {
  if (previous.appointments < MIN_APPOINTMENTS_FOR_RATE_INSIGHT) return null;
  const change = (current.appointments - previous.appointments) / previous.appointments;
  if (Math.abs(change) < 0.05) return null; // not worth mentioning under 5%

  const direction = change > 0 ? "increased" : "decreased";
  return {
    id: `period-change:${label}`,
    text: `Team appointment volume ${direction} ${Math.abs(change * 100).toFixed(0)}% ${label}.`,
  };
}

/** Runs every insight generator and returns whatever the data actually supports — never fabricated. */
export function generateInsights(input: {
  leadLists: NamedTotals[];
  setters: NamedTotals[];
  current: { appointments: number };
  previous: { appointments: number };
  periodLabel: string;
}): Insight[] {
  const insights: Insight[] = [];

  const topList = topLeadListBySetRate(input.leadLists);
  if (topList) insights.push(topList);

  insights.push(...settersAboveTeamAverage(input.setters));
  insights.push(...leadListsAboveTeamAverage(input.leadLists));

  const trend = periodOverPeriodChange(input.current, input.previous, input.periodLabel);
  if (trend) insights.push(trend);

  return insights;
}

// Re-exported for callers that only need per-hour comparisons alongside insights.
export { perHour };
