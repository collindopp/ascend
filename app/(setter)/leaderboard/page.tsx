import { requireUser } from "@/lib/auth/dal";
import { getLeaderboardRows, LEADERBOARD_KPIS } from "@/lib/analytics/leaderboard";
import { getWeeklyGoalProgress, getCurrentWeekRange } from "@/lib/goals/queries";
import { resolveDateRange } from "@/lib/utils/date-range";
import { LiveLeaderboard } from "@/components/leaderboard/LiveLeaderboard";
import { WeeklyGoalsBoard } from "@/components/leaderboard/WeeklyGoalsBoard";

const PRESET_OPTIONS = ["today", "7d", "30d"] as const;

export default async function SetterLeaderboardPage() {
  const user = await requireUser();
  const [initialRows, initialGoalRows] = await Promise.all([
    getLeaderboardRows(resolveDateRange("today"), "appointments"),
    getWeeklyGoalProgress(),
  ]);
  const week = getCurrentWeekRange();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Leaderboard</h1>
        <p className="mt-1 text-sm text-text-tertiary">Where the team stands right now.</p>
      </div>

      <WeeklyGoalsBoard
        initialRows={initialGoalRows}
        weekStartIso={week.start.toISOString()}
        weekEndIso={week.end.toISOString()}
      />

      <LiveLeaderboard
        initialRows={initialRows.map((r) => ({ id: r.id, name: r.name, rankValue: r.rankValue }))}
        initialKpi="appointments"
        kpiOptions={LEADERBOARD_KPIS}
        initialPreset="today"
        presetOptions={PRESET_OPTIONS}
        viewerId={user.id}
      />
    </div>
  );
}
