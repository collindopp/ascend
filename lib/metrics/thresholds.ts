/**
 * Minimum sample sizes before a metric is allowed to participate in ranking
 * or an insight. Without these, a lead list with 4 appointments out of 10
 * conversations (40%) would rank above one with 170 out of 1,000 (17%) —
 * technically higher, statistically meaningless. See section 14 of the
 * ASCEND spec: "Never declare a lead list 'best' based on tiny sample sizes."
 */
export const MIN_CONVERSATIONS_FOR_SET_RATE_RANKING = 30;
export const MIN_DIALS_FOR_CONVERSION_RANKING = 100;
export const MIN_APPOINTMENTS_FOR_RATE_INSIGHT = 5;
export const MIN_DIALS_FOR_HOURLY_RANKING = 100;

export function meetsSetRateThreshold(conversations: number): boolean {
  return conversations >= MIN_CONVERSATIONS_FOR_SET_RATE_RANKING;
}

export function meetsConversionRateThreshold(dials: number): boolean {
  return dials >= MIN_DIALS_FOR_CONVERSION_RANKING;
}

export function meetsHourlyRankingThreshold(dials: number): boolean {
  return dials >= MIN_DIALS_FOR_HOURLY_RANKING;
}
