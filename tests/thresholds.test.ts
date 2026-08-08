import { describe, it, expect } from "vitest";
import {
  meetsSetRateThreshold,
  meetsConversionRateThreshold,
  meetsHourlyRankingThreshold,
  MIN_CONVERSATIONS_FOR_SET_RATE_RANKING,
  MIN_DIALS_FOR_CONVERSION_RANKING,
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

  it("gates conversion-rate ranking on dial volume", () => {
    expect(meetsConversionRateThreshold(MIN_DIALS_FOR_CONVERSION_RANKING)).toBe(true);
    expect(meetsConversionRateThreshold(MIN_DIALS_FOR_CONVERSION_RANKING - 1)).toBe(false);
  });

  it("gates hourly-rate ranking the same way", () => {
    expect(meetsHourlyRankingThreshold(0)).toBe(false);
    expect(meetsHourlyRankingThreshold(1000)).toBe(true);
  });
});
