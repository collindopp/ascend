import { describe, it, expect } from "vitest";
import { resolveDateRange, previousPeriod, parseRangeParam } from "@/lib/utils/date-range";

describe("resolveDateRange", () => {
  it("today spans a single calendar day", () => {
    const { start, end } = resolveDateRange("today");
    expect(start.getDate()).toBe(end.getDate());
    expect(start.getHours()).toBe(0);
    expect(end.getHours()).toBe(23);
  });

  it("7d covers 7 inclusive calendar days ending today", () => {
    const { start, end } = resolveDateRange("7d");
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(7); // startOfDay(today-6) .. endOfDay(today) = 7 calendar days
  });

  it("yesterday does not overlap today", () => {
    const today = resolveDateRange("today");
    const yesterday = resolveDateRange("yesterday");
    expect(yesterday.end.getTime()).toBeLessThan(today.start.getTime());
  });
});

describe("previousPeriod", () => {
  it("returns a same-length window immediately before the given range", () => {
    const range = resolveDateRange("7d");
    const prev = previousPeriod(range);
    const currentLength = range.end.getTime() - range.start.getTime();
    const prevLength = prev.end.getTime() - prev.start.getTime();
    expect(prevLength).toBeCloseTo(currentLength, -2);
    expect(prev.end.getTime()).toBeLessThan(range.start.getTime());
  });
});

describe("parseRangeParam", () => {
  it("defaults to 30 days when no range param is present", () => {
    const { preset } = parseRangeParam({});
    expect(preset).toBe("30d");
  });

  it("rejects an invalid preset and falls back to the default", () => {
    const { preset } = parseRangeParam({ range: "not-a-real-preset" });
    expect(preset).toBe("30d");
  });

  it("accepts a valid preset", () => {
    const { preset } = parseRangeParam({ range: "today" });
    expect(preset).toBe("today");
  });
});
