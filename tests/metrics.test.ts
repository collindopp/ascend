import { describe, it, expect } from "vitest";
import {
  conversionRate,
  setRateFromConversations,
  setRateFromDials,
  dialsPerAppointment,
  conversationsPerAppointment,
  perHour,
  dqRate,
  wrongNumberRate,
  outcomesWorked,
  deriveMetrics,
  sumTotals,
  notInterestedRate,
  followUpRate,
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

describe("outcomesWorked", () => {
  it("sums conversations, DQ, and wrong-number — but never double-counts appointments", () => {
    // An appointment is an extra tap on an already-logged conversation, not a distinct outcome.
    expect(outcomesWorked(50, 8, 4)).toBe(62);
  });
});

describe("dqRate / wrongNumberRate", () => {
  it("computes each as a share of total worked leads (conversations + DQ + wrong#)", () => {
    // 62 total worked: 50 conversations, 8 DQ, 4 wrong#
    expect(dqRate(8, 50, 4)).toBeCloseTo((8 / 62) * 100, 5);
    expect(wrongNumberRate(4, 50, 8)).toBeCloseTo((4 / 62) * 100, 5);
  });

  it("returns null when nothing has been worked yet", () => {
    expect(dqRate(0, 0, 0)).toBeNull();
    expect(wrongNumberRate(0, 0, 0)).toBeNull();
  });
});

describe("deriveMetrics", () => {
  it("computes the full standard metric set from raw totals", () => {
    const metrics = deriveMetrics({ dials: 427, conversations: 71, appointments: 11, dq: 9, wrongNumber: 5, pickUps: 0, notInterested: 0, followUp: 0, durationSeconds: 3600 });
    expect(metrics.conversionRate).toBeCloseTo(16.62, 1);
    expect(metrics.setRateFromConversations).toBeCloseTo(15.49, 1);
    expect(metrics.setRateFromDials).toBeCloseTo(2.58, 1);
    expect(metrics.dialsPerHour).toBeCloseTo(427, 5);
    expect(metrics.conversationsPerHour).toBeCloseTo(71, 5);
    expect(metrics.appointmentsPerHour).toBeCloseTo(11, 5);
    expect(metrics.dqRate).toBeCloseTo((9 / 85) * 100, 5);
    expect(metrics.wrongNumberRate).toBeCloseTo((5 / 85) * 100, 5);
  });

  it("returns all nulls for a completely empty session — never partial garbage", () => {
    const metrics = deriveMetrics({ dials: 0, conversations: 0, appointments: 0, dq: 0, wrongNumber: 0, pickUps: 0, notInterested: 0, followUp: 0, durationSeconds: 0 });
    expect(metrics.conversionRate).toBeNull();
    expect(metrics.setRateFromConversations).toBeNull();
    expect(metrics.setRateFromDials).toBeNull();
    expect(metrics.dialsPerAppointment).toBeNull();
    expect(metrics.conversationsPerAppointment).toBeNull();
    expect(metrics.dialsPerHour).toBeNull();
    expect(metrics.conversationsPerHour).toBeNull();
    expect(metrics.appointmentsPerHour).toBeNull();
    expect(metrics.dqRate).toBeNull();
    expect(metrics.wrongNumberRate).toBeNull();
  });
});

describe("sumTotals", () => {
  it("sums raw totals across multiple rows", () => {
    const totals = sumTotals([
      { dials: 10, conversations: 2, appointments: 1, dq: 1, wrongNumber: 0, pickUps: 0, notInterested: 0, followUp: 0, durationSeconds: 600 },
      { dials: 20, conversations: 4, appointments: 2, dq: 0, wrongNumber: 1, pickUps: 0, notInterested: 0, followUp: 0, durationSeconds: 1200 },
    ]);
    expect(totals).toEqual({ dials: 30, conversations: 6, appointments: 3, dq: 1, wrongNumber: 1, pickUps: 0, notInterested: 0, followUp: 0, durationSeconds: 1800 });
  });

  it("returns all zeros for an empty list", () => {
    expect(sumTotals([])).toEqual({ dials: 0, conversations: 0, appointments: 0, dq: 0, wrongNumber: 0, pickUps: 0, notInterested: 0, followUp: 0, durationSeconds: 0 });
  });
});

describe("notInterestedRate / followUpRate", () => {
  it("measures both against conversations, since each is a tag on one", () => {
    // 100 conversations, 20 of which the prospect declined outright.
    expect(notInterestedRate(20, 100)).toBe(20);
    expect(followUpRate(5, 100)).toBe(5);
  });

  it("returns null rather than dividing by zero when nobody was reached", () => {
    expect(notInterestedRate(0, 0)).toBeNull();
    expect(followUpRate(3, 0)).toBeNull();
  });

  it("leaves the quality rates alone — these tags ride on conversations already counted", () => {
    const withTags = deriveMetrics({
      dials: 0,
      conversations: 100,
      appointments: 10,
      dq: 20,
      wrongNumber: 5,
      pickUps: 40,
      notInterested: 30,
      followUp: 8,
      durationSeconds: 3600,
    });
    const withoutTags = deriveMetrics({
      dials: 0,
      conversations: 100,
      appointments: 10,
      dq: 20,
      wrongNumber: 5,
      pickUps: 0,
      notInterested: 0,
      followUp: 0,
      durationSeconds: 3600,
    });

    // DQ ÷ (100 + 20 + 5) either way — the new counters must not enter the denominator.
    expect(withTags.dqRate).toBe(withoutTags.dqRate);
    expect(withTags.wrongNumberRate).toBe(withoutTags.wrongNumberRate);
    expect(withTags.setRateFromConversations).toBe(withoutTags.setRateFromConversations);
  });
});
