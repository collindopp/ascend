import { describe, it, expect } from "vitest";
import { formatMetricInt, formatPercent, formatRate, formatSignedPercent, formatDuration, formatDurationCompact } from "@/lib/format/number";

describe("formatPercent", () => {
  it("formats a normal rate", () => {
    expect(formatPercent(16.615)).toBe("16.6%");
  });

  it("renders null as an em dash, never NaN% or Infinity%", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(NaN)).toBe("—");
    expect(formatPercent(Infinity)).toBe("—");
  });
});

describe("formatMetricInt / formatRate / formatSignedPercent", () => {
  it("renders null as an em dash across every formatter", () => {
    expect(formatMetricInt(null)).toBe("—");
    expect(formatRate(null)).toBe("—");
    expect(formatSignedPercent(null)).toBe("—");
  });

  it("signs positive and negative deltas correctly", () => {
    expect(formatSignedPercent(21.7)).toBe("+21.7%");
    expect(formatSignedPercent(-4.2)).toBe("-4.2%");
  });
});

describe("formatDuration / formatDurationCompact", () => {
  it("formats under an hour as M:SS", () => {
    expect(formatDuration(90)).toBe("1:30");
  });

  it("formats an hour or more as H:MM:SS", () => {
    expect(formatDuration(3661)).toBe("1:01:01");
  });

  it("never goes negative on bad input", () => {
    expect(formatDuration(-5)).toBe("0:00");
  });

  it("formats compact duration for history rows", () => {
    expect(formatDurationCompact(6120)).toBe("1h 42m");
    expect(formatDurationCompact(300)).toBe("5m");
  });
});
