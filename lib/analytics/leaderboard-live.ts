"use server";

import { requireActionRole } from "@/lib/auth/guard";
import { getLeaderboardRows, LEADERBOARD_KPIS, type LeaderboardKpi } from "@/lib/analytics/leaderboard";
import { resolveDateRange, type DateRangePreset } from "@/lib/utils/date-range";

const VALID_PRESETS: DateRangePreset[] = ["today", "yesterday", "7d", "30d", "90d"];

export interface LiveLeaderboardRow {
  id: string;
  name: string;
  rankValue: number | null;
}

export type LiveLeaderboardResult =
  | { ok: true; data: LiveLeaderboardRow[] }
  | { ok: false; error: string };

/**
 * Polled by the live leaderboard client component. Open to any authenticated
 * role by design — this feature only exists to be competitive and visible
 * across the whole team, setters included (see the leaderboard visibility
 * decision in conversation).
 */
export async function fetchLiveLeaderboard(presetInput: unknown, kpiInput: unknown): Promise<LiveLeaderboardResult> {
  await requireActionRole(["SETTER", "MANAGER", "ADMIN"]);

  const preset = VALID_PRESETS.includes(presetInput as DateRangePreset) ? (presetInput as DateRangePreset) : "today";
  const kpi = (LEADERBOARD_KPIS as readonly string[]).includes(kpiInput as string)
    ? (kpiInput as LeaderboardKpi)
    : "appointments";

  const range = resolveDateRange(preset);
  const rows = await getLeaderboardRows(range, kpi);

  return {
    ok: true,
    data: rows.map((r) => ({ id: r.id, name: r.name, rankValue: r.rankValue })),
  };
}
