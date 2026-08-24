import { setRateFromConversations, dqRate, perHour, type RawTotals } from "@/lib/metrics/core";
import {
  meetsSetRateThreshold,
  meetsQualityRankingThreshold,
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
 * "<Lead list> currently has the highest disqualification rate across the team."
 * Surfaces the worst-quality list so managers can investigate the source
 * before it drags down team-wide numbers — only fires when the underlying
 * worked-lead volume is large enough to be meaningful.
 */
export function worstQualityLeadList(lists: NamedTotals[]): Insight | null {
  const eligible = lists
    .filter((l) => meetsQualityRankingThreshold(l.conversations, l.dq, l.wrongNumber))
    .map((l) => ({ ...l, rate: dqRate(l.dq, l.conversations, l.wrongNumber) }))
    .filter((l): l is NamedTotals & { rate: number } => l.rate !== null && l.rate > 0)
    .sort((a, b) => b.rate - a.rate);

  const worst = eligible[0];
  if (!worst) return null;

  return {
    id: `worst-quality-lead-list:${worst.id}`,
    text: `${worst.name} currently has the highest disqualification rate across the team (${worst.rate.toFixed(1)}%).`,
  };
}

/**
 * "<Setter>'s set rate is N% above the team average."
 * Compares each setter's set rate to the team average, only for setters
 * with enough conversations to be meaningful, and only when the gap is
 * large enough to be worth surfacing.
 */
export function settersAboveTeamAverage(setters: NamedTotals[]): Insight[] {
  const teamTotals = setters.reduce(
    (acc, s) => ({ conversations: acc.conversations + s.conversations, appointments: acc.appointments + s.appointments }),
    { conversations: 0, appointments: 0 },
  );
  const teamRate = setRateFromConversations(teamTotals.appointments, teamTotals.conversations);
  if (teamRate === null || teamRate === 0) return [];

  const insights: Insight[] = [];
  for (const setter of setters) {
    if (!meetsSetRateThreshold(setter.conversations)) continue;
    const rate = setRateFromConversations(setter.appointments, setter.conversations);
    if (rate === null) continue;

    const relativeDiff = (rate - teamRate) / teamRate;
    if (relativeDiff >= RELATIVE_DIFF_THRESHOLD) {
      insights.push({
        id: `setter-above-average:${setter.id}`,
        text: `${setter.name}'s set rate is ${(relativeDiff * 100).toFixed(0)}% above the team average.`,
      });
    }
  }
  return insights;
}

/**
 * "<Lead list>'s set rate is N% above the team average."
 */
export function leadListsAboveTeamAverage(lists: NamedTotals[]): Insight[] {
  const teamTotals = lists.reduce(
    (acc, l) => ({ conversations: acc.conversations + l.conversations, appointments: acc.appointments + l.appointments }),
    { conversations: 0, appointments: 0 },
  );
  const teamRate = setRateFromConversations(teamTotals.appointments, teamTotals.conversations);
  if (teamRate === null || teamRate === 0) return [];

  const insights: Insight[] = [];
  for (const list of lists) {
    if (!meetsSetRateThreshold(list.conversations)) continue;
    const rate = setRateFromConversations(list.appointments, list.conversations);
    if (rate === null) continue;

    const relativeDiff = (rate - teamRate) / teamRate;
    if (relativeDiff >= RELATIVE_DIFF_THRESHOLD) {
      insights.push({
        id: `lead-list-above-average:${list.id}`,
        text: `${list.name}'s set rate is ${(relativeDiff * 100).toFixed(0)}% above the team average.`,
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

/**
 * "<Setter> logged no active time yesterday." — a daily-digest check, not a
 * range comparison: always evaluates the most recently completed day
 * regardless of whatever date range the Overview page has selected.
 */
export function zeroActivityYesterday(setters: { setterId: string; setterName: string }[]): Insight[] {
  return setters.map((s) => ({
    id: `zero-activity-yesterday:${s.setterId}`,
    text: `${s.setterName} logged no active time yesterday.`,
  }));
}

/** Runs every insight generator and returns whatever the data actually supports — never fabricated. */
export function generateInsights(input: {
  leadLists: NamedTotals[];
  setters: NamedTotals[];
  current: { appointments: number };
  previous: { appointments: number };
  periodLabel: string;
  zeroActivitySetters?: { setterId: string; setterName: string }[];
}): Insight[] {
  const insights: Insight[] = [];

  if (input.zeroActivitySetters) {
    insights.push(...zeroActivityYesterday(input.zeroActivitySetters));
  }

  const topList = topLeadListBySetRate(input.leadLists);
  if (topList) insights.push(topList);

  const worstQuality = worstQualityLeadList(input.leadLists);
  if (worstQuality) insights.push(worstQuality);

  insights.push(...settersAboveTeamAverage(input.setters));
  insights.push(...leadListsAboveTeamAverage(input.leadLists));

  const trend = periodOverPeriodChange(input.current, input.previous, input.periodLabel);
  if (trend) insights.push(trend);

  return insights;
}

// Re-exported for callers that only need per-hour comparisons alongside insights.
export { perHour };
