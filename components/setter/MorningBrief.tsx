import Link from "next/link";
import type { MorningBrief as Brief } from "@/lib/sessions/morning-brief";
import { formatInt } from "@/lib/format/number";
import { cn } from "@/lib/utils/cn";

/**
 * The rep's standing at a glance: goal progress first and largest, because
 * "how far do I have to go" is the question they open the app with.
 *
 * Everything here is this-week or today. The all-time totals live further
 * down the Performance page — lifetime figures barely move day to day, so
 * leading with them makes the screen feel static and not worth revisiting.
 */
export function MorningBrief({ brief, compact = false }: { brief: Brief; compact?: boolean }) {
  const { goal, rank, today, daysLogged } = brief;
  const hasGoal = goal.target !== null && goal.target > 0;
  const met = hasGoal && (goal.percent ?? 0) >= 100;
  const barWidth = hasGoal ? Math.min(100, goal.percent ?? 0) : 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-[var(--radius-lg)] border bg-gradient-to-b from-surface-2/40 to-surface-1 p-5 shadow-[var(--shadow-card)]",
        met ? "border-accent-border" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">This week</p>
          {hasGoal ? (
            <p className="mt-1 flex items-baseline gap-2">
              <span className={cn("font-mono text-4xl font-semibold leading-none tracking-tight", met ? "text-accent" : "text-text-primary")}>
                {formatInt(goal.current)}
              </span>
              <span className="font-mono text-lg text-text-tertiary">/ {formatInt(goal.target as number)} sets</span>
            </p>
          ) : (
            <p className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-4xl font-semibold leading-none tracking-tight text-text-primary">
                {formatInt(goal.current)}
              </span>
              <span className="text-sm text-text-tertiary">sets · no goal set yet</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-5 text-right">
          {rank && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">Rank</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-text-primary">
                {rank.position}
                <span className="text-sm font-normal text-text-tertiary"> of {rank.of}</span>
              </p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">Days logged</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-text-primary">
              {daysLogged.logged}
              <span className="text-sm font-normal text-text-tertiary"> of {daysLogged.elapsed}</span>
            </p>
          </div>
        </div>
      </div>

      {hasGoal && (
        <div className="flex flex-col gap-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <p className="text-xs text-text-tertiary">
            {met ? (
              <span className="text-accent">Goal hit — everything from here is ahead of target.</span>
            ) : (
              <>
                <span className="font-medium text-text-secondary">{formatInt(goal.remaining ?? 0)} to go</span> to hit
                your goal this week.
              </>
            )}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border-subtle pt-3">
        <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">Today</p>
        <span className="font-mono text-sm tabular-nums text-text-secondary">
          <span className="text-text-primary">{formatInt(today.conversations)}</span> conversations
        </span>
        <span className="font-mono text-sm tabular-nums text-text-secondary">
          <span className="text-accent">{formatInt(today.sets)}</span> sets
        </span>
        {today.textAppointments > 0 && (
          <span className="font-mono text-sm tabular-nums text-text-tertiary">
            ({formatInt(today.textAppointments)} over text)
          </span>
        )}
        {compact && (
          <Link href="/performance" className="ml-auto text-xs text-text-tertiary hover:text-accent">
            Full performance →
          </Link>
        )}
      </div>
    </div>
  );
}
