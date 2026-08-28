import { describe, it, expect } from "vitest";
import { startOfBusinessDay } from "@/lib/utils/business-day";

/**
 * The whole point of this helper is that the server's own clock (UTC on
 * Vercel) has already rolled into tomorrow while the team is still working
 * today, so every case here is pinned to an explicit instant rather than
 * "now".
 */
describe("startOfBusinessDay", () => {
  it("still returns today when UTC has already rolled over to tomorrow", () => {
    // 02:00 UTC on the 28th is 20:00 on the 27th in Denver (MDT, UTC-6).
    const evening = new Date("2026-08-28T02:00:00Z");
    // Midnight on the 27th in Denver is 06:00 UTC that same day.
    expect(startOfBusinessDay(evening).toISOString()).toBe("2026-08-27T06:00:00.000Z");
  });

  it("handles standard time, where the offset differs from summer", () => {
    // 03:00 UTC on Jan 15 is 20:00 Jan 14 in Denver (MST, UTC-7).
    const winterEvening = new Date("2026-01-15T03:00:00Z");
    expect(startOfBusinessDay(winterEvening).toISOString()).toBe("2026-01-14T07:00:00.000Z");
  });

  it("returns the same boundary from any instant within one business day", () => {
    const morning = startOfBusinessDay(new Date("2026-08-27T15:00:00Z")); // 09:00 MDT
    const evening = startOfBusinessDay(new Date("2026-08-28T03:30:00Z")); // 21:30 MDT, same day
    expect(morning.toISOString()).toBe(evening.toISOString());
  });

  it("advances to the next boundary once the business day actually turns over", () => {
    const beforeMidnight = startOfBusinessDay(new Date("2026-08-28T05:59:00Z")); // 23:59 MDT on the 27th
    const afterMidnight = startOfBusinessDay(new Date("2026-08-28T06:01:00Z")); // 00:01 MDT on the 28th
    expect(beforeMidnight.toISOString()).toBe("2026-08-27T06:00:00.000Z");
    expect(afterMidnight.toISOString()).toBe("2026-08-28T06:00:00.000Z");
  });

  it("lands on a real midnight across the spring-forward transition", () => {
    // DST began Mar 8 2026; the 9th is squarely in MDT.
    const afterSpringForward = startOfBusinessDay(new Date("2026-03-09T18:00:00Z"));
    expect(afterSpringForward.toISOString()).toBe("2026-03-09T06:00:00.000Z");
    // The day before the switch is still MST.
    const beforeSpringForward = startOfBusinessDay(new Date("2026-03-07T18:00:00Z"));
    expect(beforeSpringForward.toISOString()).toBe("2026-03-07T07:00:00.000Z");
  });
});
