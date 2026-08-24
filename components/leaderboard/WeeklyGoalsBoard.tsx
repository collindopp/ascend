"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWeeklyGoalProgress } from "@/lib/goals/actions";
import type { WeeklyGoalRow } from "@/lib/goals/queries";
import { LocalDateTime } from "@/components/ui/LocalDateTime";
import { formatInt } from "@/lib/format/number";
import { cn } from "@/lib/utils/cn";

const POLL_INTERVAL_MS = 15000;

interface WeeklyGoalsBoardProps {
  initialRows: WeeklyGoalRow[];
  weekStartIso: string;
  weekEndIso: string;
}

export function WeeklyGoalsBoard({ initialRows, weekStartIso, weekEndIso }: WeeklyGoalsBoardProps) {
  const [rows, setRows] = useState(initialRows);
  const [updatedAt, setUpdatedAt] = useState(() => Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const refresh = useCallback(async () => {
    const result = await fetchWeeklyGoalProgress();
    if (!result.ok) return;
    setRows(result.data);
    setUpdatedAt(Date.now());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => setSecondsAgo(Math.max(0, Math.round((Date.now() - updatedAt) / 1000))), 1000);
    return () => clearInterval(interval);
  }, [updatedAt]);

  const rankable = rows.filter((r) => r.target !== null && r.target > 0);

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface-1 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Weekly Sets Goal</h2>
          <p className="mt-0.5 text-xs text-text-tertiary">
            Week of <LocalDateTime iso={weekStartIso} options={{ month: "short", day: "numeric" }} /> –{" "}
            <LocalDateTime iso={weekEndIso} options={{ month: "short", day: "numeric" }} />
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-live-pulse" aria-hidden />
          <span>Live · {secondsAgo < 2 ? "just now" : `${secondsAgo}s ago`}</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-tertiary">No reps yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle">
          {rows.map((row) => {
            const hasGoal = row.target !== null && row.target > 0;
            const met = hasGoal && (row.percent ?? 0) >= 100;
            const barWidth = hasGoal ? Math.min(100, row.percent ?? 0) : 0;
            const rank = hasGoal ? rankable.findIndex((r) => r.id === row.id) + 1 : null;

            return (
              <div key={row.id} className="flex flex-col gap-2 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={cn("w-4 font-mono text-xs tabular-nums", rank ? "text-text-tertiary" : "text-text-disabled")}>
                      {rank ?? "—"}
                    </span>
                    <span className="text-sm font-medium text-text-primary">{row.name}</span>
                    {met && (
                      <span className="rounded-full bg-accent-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                        Goal hit
                      </span>
                    )}
                  </div>
                  <span className={cn("font-mono text-xs tabular-nums", met ? "text-accent" : "text-text-secondary")}>
                    {hasGoal ? `${formatInt(row.current)} / ${formatInt(row.target as number)}` : `${formatInt(row.current)} · no goal set`}
                  </span>
                </div>
                {hasGoal && (
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${barWidth}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
