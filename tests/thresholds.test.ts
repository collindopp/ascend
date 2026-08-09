import { describe, it, expect } from "vitest";
import {
  meetsSetRateThreshold,
  meetsHourlyRankingThreshold,
  meetsQualityRankingThreshold,
  MIN_CONVERSATIONS_FOR_SET_RATE_RANKING,
  MIN_HOURS_FOR_HOURLY_RANKING,
  MIN_OUTCOMES_FOR_QUALITY_RANKING,
} from "@/lib/metrics/thresholds";

describe("ranking thresholds", () => {
  it("rejects a lead list with a tiny but flashy sample", () => {
    // 4 appointments / 10 conversations = 40% — should NOT be rank-eligible.
    expect(meetsSetRateThreshold(10)).toBe(false);
  });

  it("accepts a lead list with a large, credible sample even at a lower rate", () => {
    // 170 appointments / 1000 conversations = 17% — should be rank-eligible.
    expect(meetsSetRateThreshold(1000)).toBe(true);
  });

  it("is a hard boundary at exactly the threshold", () => {
    expect(meetsSetRateThreshold(MIN_CONVERSATIONS_FOR_SET_RATE_RANKING)).toBe(true);
    expect(meetsSetRateThreshold(MIN_CONVERSATIONS_FOR_SET_RATE_RANKING - 1)).toBe(false);
  });

  it("gates hourly-rate ranking on session-hours worked, not dial volume", () => {
    expect(meetsHourlyRankingThreshold(0)).toBe(false);
    expect(meetsHourlyRankingThreshold(MIN_HOURS_FOR_HOURLY_RANKING * 3600)).toBe(true);
    expect(meetsHourlyRankingThreshold(MIN_HOURS_FOR_HOURLY_RANKING * 3600 - 1)).toBe(false);
  });

  it("gates DQ/wrong-number ranking on total worked-lead volume", () => {
    // 20 conversations + 5 DQ + 4 wrong# = 29, just under the threshold.
    expect(meetsQualityRankingThreshold(20, 5, 4)).toBe(false);
    // One more worked lead clears it.
    expect(meetsQualityRankingThreshold(20, 5, 5)).toBe(true);
    expect(meetsQualityRankingThreshold(0, 0, 0)).toBe(false);
    expect(MIN_OUTCOMES_FOR_QUALITY_RANKING).toBeGreaterThan(0);
  });
});
