/**
 * Minimum sample sizes before a metric is allowed to participate in ranking
 * or an insight. Without these, a lead list with 4 appointments out of 10
 * conversations (40%) would rank above one with 170 out of 1,000 (17%) —
 * technically higher, statistically meaningless. See section 14 of the
 * ASCEND spec: "Never declare a lead list 'best' based on tiny sample sizes."
 *
 * Dial counts are no longer manually tracked by setters (a separate dialer
 * handles that, fed in later via the 2X Connect integration) — so every
 * threshold here is keyed on conversations or session-hours worked, the two
 * signals ASCEND actually collects today.
 */
export const MIN_CONVERSATIONS_FOR_SET_RATE_RANKING = 30;
export const MIN_APPOINTMENTS_FOR_RATE_INSIGHT = 5;
export const MIN_HOURS_FOR_HOURLY_RANKING = 3;
export const MIN_OUTCOMES_FOR_QUALITY_RANKING = 30;

export function meetsSetRateThreshold(conversations: number): boolean {
  return conversations >= MIN_CONVERSATIONS_FOR_SET_RATE_RANKING;
}

export function meetsHourlyRankingThreshold(durationSeconds: number): boolean {
  return durationSeconds >= MIN_HOURS_FOR_HOURLY_RANKING * 3600;
}

/** Gates DQ-rate / wrong-number-rate ranking on total worked-lead volume, same statistical logic as set rate. */
export function meetsQualityRankingThreshold(conversations: number, dq: number, wrongNumber: number): boolean {
  return conversations + dq + wrongNumber >= MIN_OUTCOMES_FOR_QUALITY_RANKING;
}
