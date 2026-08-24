import { describe, it, expect } from "vitest";
import {
  topLeadListBySetRate,
  worstQualityLeadList,
  settersAboveTeamAverage,
  leadListsAboveTeamAverage,
  periodOverPeriodChange,
  zeroActivityYesterday,
  generateInsights,
  type NamedTotals,
} from "@/lib/insights";

describe("topLeadListBySetRate", () => {
  it("never lets a tiny sample beat a large one (section 14 of the spec)", () => {
    const lists: NamedTotals[] = [
      { id: "small", name: "Small Flashy List", dials: 40, conversations: 10, appointments: 4, dq: 0, wrongNumber: 0, durationSeconds: 3600 },
      { id: "big", name: "Big Credible List", dials: 4000, conversations: 1000, appointments: 170, dq: 0, wrongNumber: 0, durationSeconds: 360000 },
    ];
    const insight = topLeadListBySetRate(lists);
    expect(insight).not.toBeNull();
    expect(insight?.text).toContain("Big Credible List");
    expect(insight?.text).not.toContain("Small Flashy List");
  });

  it("returns null when nothing clears the sample threshold — never fabricates a winner", () => {
    const lists: NamedTotals[] = [
      { id: "a", name: "A", dials: 10, conversations: 2, appointments: 1, dq: 0, wrongNumber: 0, durationSeconds: 600 },
    ];
    expect(topLeadListBySetRate(lists)).toBeNull();
  });

  it("returns null for an empty list", () => {
    expect(topLeadListBySetRate([])).toBeNull();
  });
});

describe("worstQualityLeadList", () => {
  it("flags the list with the highest disqualification rate once it clears the sample threshold", () => {
    const lists: NamedTotals[] = [
      { id: "clean", name: "Clean List", dials: 0, conversations: 100, appointments: 15, dq: 5, wrongNumber: 5, durationSeconds: 3600 },
      { id: "messy", name: "Messy List", dials: 0, conversations: 100, appointments: 10, dq: 40, wrongNumber: 20, durationSeconds: 3600 },
    ];
    const insight = worstQualityLeadList(lists);
    expect(insight).not.toBeNull();
    expect(insight?.text).toContain("Messy List");
    expect(insight?.text).not.toContain("Clean List");
  });

  it("returns null when no list clears the worked-lead volume threshold", () => {
    const lists: NamedTotals[] = [
      { id: "tiny", name: "Tiny List", dials: 0, conversations: 5, appointments: 1, dq: 3, wrongNumber: 1, durationSeconds: 600 },
    ];
    expect(worstQualityLeadList(lists)).toBeNull();
  });

  it("returns null when disqualification rate is exactly zero everywhere — nothing to flag", () => {
    const lists: NamedTotals[] = [
      { id: "perfect", name: "Perfect List", dials: 0, conversations: 100, appointments: 20, dq: 0, wrongNumber: 0, durationSeconds: 3600 },
    ];
    expect(worstQualityLeadList(lists)).toBeNull();
  });
});

describe("settersAboveTeamAverage", () => {
  it("only flags setters meaningfully above average with enough volume", () => {
    const setters: NamedTotals[] = [
      { id: "s1", name: "Star Setter", dials: 0, conversations: 150, appointments: 45, dq: 0, wrongNumber: 0, durationSeconds: 36000 },
      { id: "s2", name: "Average Setter", dials: 0, conversations: 150, appointments: 15, dq: 0, wrongNumber: 0, durationSeconds: 36000 },
    ];
    const insights = settersAboveTeamAverage(setters);
    expect(insights.some((i) => i.text.includes("Star Setter"))).toBe(true);
    expect(insights.some((i) => i.text.includes("Average Setter"))).toBe(false);
  });

  it("ignores setters below the conversation-volume threshold even if their rate looks great", () => {
    const setters: NamedTotals[] = [
      { id: "s1", name: "Lucky Streak", dials: 0, conversations: 5, appointments: 5, dq: 0, wrongNumber: 0, durationSeconds: 300 },
      { id: "s2", name: "Everyone Else", dials: 0, conversations: 500, appointments: 60, dq: 0, wrongNumber: 0, durationSeconds: 36000 },
    ];
    const insights = settersAboveTeamAverage(setters);
    expect(insights.some((i) => i.text.includes("Lucky Streak"))).toBe(false);
  });
});

describe("leadListsAboveTeamAverage", () => {
  it("flags a list with a set rate meaningfully above the team average", () => {
    const lists: NamedTotals[] = [
      { id: "l1", name: "Hot List", dials: 0, conversations: 300, appointments: 60, dq: 0, wrongNumber: 0, durationSeconds: 72000 },
      { id: "l2", name: "Cold List", dials: 0, conversations: 300, appointments: 20, dq: 0, wrongNumber: 0, durationSeconds: 72000 },
    ];
    const insights = leadListsAboveTeamAverage(lists);
    expect(insights.some((i) => i.text.includes("Hot List"))).toBe(true);
    expect(insights.some((i) => i.text.includes("Cold List"))).toBe(false);
  });
});

describe("periodOverPeriodChange", () => {
  it("reports a meaningful increase", () => {
    const insight = periodOverPeriodChange({ appointments: 118 }, { appointments: 100 }, "this week");
    expect(insight).not.toBeNull();
    expect(insight?.text).toContain("increased");
    expect(insight?.text).toContain("18%");
  });

  it("reports a meaningful decrease", () => {
    const insight = periodOverPeriodChange({ appointments: 80 }, { appointments: 100 }, "this week");
    expect(insight?.text).toContain("decreased");
  });

  it("stays silent on a trivial change under 5%", () => {
    expect(periodOverPeriodChange({ appointments: 102 }, { appointments: 100 }, "this week")).toBeNull();
  });

  it("stays silent when the previous period has too little data to be meaningful", () => {
    expect(periodOverPeriodChange({ appointments: 10 }, { appointments: 1 }, "this week")).toBeNull();
  });
});

describe("zeroActivityYesterday", () => {
  it("flags every setter with no logged activity yesterday", () => {
    const insights = zeroActivityYesterday([{ setterId: "s1", setterName: "Quiet Rep" }]);
    expect(insights).toHaveLength(1);
    expect(insights[0]?.text).toBe("Quiet Rep logged no active time yesterday.");
  });

  it("stays silent when nobody had a zero-activity day", () => {
    expect(zeroActivityYesterday([])).toEqual([]);
  });
});

describe("generateInsights", () => {
  it("only returns insights the underlying data actually supports", () => {
    const insights = generateInsights({
      leadLists: [],
      setters: [],
      current: { appointments: 0 },
      previous: { appointments: 0 },
      periodLabel: "this week",
    });
    expect(insights).toEqual([]);
  });

  it("includes zero-activity-yesterday insights first when provided", () => {
    const insights = generateInsights({
      leadLists: [],
      setters: [],
      current: { appointments: 0 },
      previous: { appointments: 0 },
      periodLabel: "this week",
      zeroActivitySetters: [{ setterId: "s1", setterName: "Quiet Rep" }],
    });
    expect(insights[0]?.text).toBe("Quiet Rep logged no active time yesterday.");
  });

  it("omits zero-activity insights entirely when the field is left undefined", () => {
    const insights = generateInsights({
      leadLists: [],
      setters: [],
      current: { appointments: 0 },
      previous: { appointments: 0 },
      periodLabel: "this week",
    });
    expect(insights.some((i) => i.text.includes("logged no active time"))).toBe(false);
  });
});
