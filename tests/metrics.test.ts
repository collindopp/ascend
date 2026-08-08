import { describe, it, expect } from "vitest";
import {
  conversionRate,
  setRateFromConversations,
  setRateFromDials,
  dialsPerAppointment,
  conversationsPerAppointment,
  perHour,
  deriveMetrics,
  sumTotals,
} from "@/lib/metrics/core";

describe("conversionRate", () => {
  it("computes conversations / dials * 100", () => {
    expect(conversionRate(71, 427)).toBeCloseTo(16.62, 1);
  });

  it("returns null on zero dials instead of NaN or Infinity", () => {
    expect(conversionRate(0, 0)).toBeNull();
    expect(conversionRate(5, 0)).toBeNull();
  });

  it("returns null on negative denominator", () => {
    expect(conversionRate(5, -10)).toBeNull();
  });
});

describe("setRateFromConversations", () => {
  it("computes appointments / conversations * 100", () => {
    expect(setRateFromConversations(11, 71)).toBeCloseTo(15.49, 1);
  });

  it("returns null on zero conversations", () => {
    expect(setRateFromConversations(0, 0)).toBeNull();
  });
});

describe("setRateFromDials", () => {
  it("computes appointments / dials * 100", () => {
    expect(setRateFromDials(11, 427)).toBeCloseTo(2.58, 1);
  });

  it("returns null on zero dials", () => {
    expect(setRateFromDials(0, 0)).toBeNull();
  });
});

describe("dialsPerAppointment / conversationsPerAppointment", () => {
  it("computes simple ratios", () => {
    expect(dialsPerAppointment(427, 11)).toBeCloseTo(38.8, 1);
    expect(conversationsPerAppointment(71, 11)).toBeCloseTo(6.45, 1);
  });

  it("returns null when there are zero appointments (can't divide by zero appointments)", () => {
    expect(dialsPerAppointment(427, 0)).toBeNull();
    expect(conversationsPerAppointment(71, 0)).toBeNull();
  });
});

describe("perHour", () => {
  it("computes count per hour from duration in seconds", () => {
    // 90 dials over exactly 1 hour (3600s) = 90/hr
    expect(perHour(90, 3600)).toBeCloseTo(90, 5);
    // 45 dials over 30 minutes = 90/hr
    expect(perHour(45, 1800)).toBeCloseTo(90, 5);
  });

  it("returns null when duration is zero", () => {
    expect(perHour(45, 0)).toBeNull();
  });

  it("never returns NaN or Infinity for any input", () => {
    const result = perHour(0, 0);
    expect(result).toBeNull();
    expect(Number.isNaN(result)).toBe(false);
  });
});

describe("deriveMetrics", () => {
  it("computes the full standard metric set from raw totals", () => {
    const metrics = deriveMetrics({ dials: 427, conversations: 71, appointments: 11, durationSeconds: 3600 });
    expect(metrics.conversionRate).toBeCloseTo(16.62, 1);
    expect(metrics.setRateFromConversations).toBeCloseTo(15.49, 1);
    expect(metrics.setRateFromDials).toBeCloseTo(2.58, 1);
    expect(metrics.dialsPerHour).toBeCloseTo(427, 5);
    expect(metrics.conversationsPerHour).toBeCloseTo(71, 5);
    expect(metrics.appointmentsPerHour).toBeCloseTo(11, 5);
  });

  it("returns all nulls for a completely empty session — never partial garbage", () => {
    const metrics = deriveMetrics({ dials: 0, conversations: 0, appointments: 0, durationSeconds: 0 });
    expect(metrics.conversionRate).toBeNull();
    expect(metrics.setRateFromConversations).toBeNull();
    expect(metrics.setRateFromDials).toBeNull();
    expect(metrics.dialsPerAppointment).toBeNull();
    expect(metrics.conversationsPerAppointment).toBeNull();
    expect(metrics.dialsPerHour).toBeNull();
    expect(metrics.conversationsPerHour).toBeNull();
    expect(metrics.appointmentsPerHour).toBeNull();
  });
});

describe("sumTotals", () => {
  it("sums raw totals across multiple rows", () => {
    const totals = sumTotals([
      { dials: 10, conversations: 2, appointments: 1, durationSeconds: 600 },
      { dials: 20, conversations: 4, appointments: 2, durationSeconds: 1200 },
    ]);
    expect(totals).toEqual({ dials: 30, conversations: 6, appointments: 3, durationSeconds: 1800 });
  });

  it("returns all zeros for an empty list", () => {
    expect(sumTotals([])).toEqual({ dials: 0, conversations: 0, appointments: 0, durationSeconds: 0 });
  });
});
