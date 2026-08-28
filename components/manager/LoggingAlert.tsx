import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { LocalDateTime } from "@/components/ui/LocalDateTime";
import { formatInt } from "@/lib/format/number";
import { cn } from "@/lib/utils/cn";
import type { LoggingHealth } from "@/lib/analytics/logging-health";

/** Past this many quiet days a lapse stops being "hasn't started yet" and needs chasing. */
const STALE_DAYS = 3;

function lapseLabel(days: number | null): string {
  if (days === null) return "No activity on record";
  if (days === 1) return "Last logged yesterday";
  return `Last logged ${days} days ago`;
}

export function LoggingAlert({ health }: { health: LoggingHealth }) {
  const { lapses, loggedTodayCount, totalSetters } = health;

  if (totalSetters === 0) return null;

  if (lapses.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-accent-border bg-accent-muted px-5 py-4">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
        <p className="text-sm text-text-primary">
          All {formatInt(totalSetters)} reps have logged today.
        </p>
      </div>
    );
  }

  const stale = lapses.filter((l) => l.daysSinceLastLogged === null || l.daysSinceLastLogged >= STALE_DAYS);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-lg)] border bg-gradient-to-b from-surface-2/40 to-surface-1 p-5 shadow-[var(--shadow-card)]",
        stale.length > 0 ? "border-danger-border" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-text-primary">
          Not logged today
          <span className="ml-2 font-mono text-xs font-normal tabular-nums text-text-tertiary">
            {formatInt(lapses.length)} of {formatInt(totalSetters)}
          </span>
        </h2>
        <span className="text-xs text-text-tertiary">
          {formatInt(loggedTodayCount)} logged so far
        </span>
      </div>

      <div className="flex flex-col divide-y divide-border-subtle">
        {lapses.map((lapse) => {
          const isStale = lapse.daysSinceLastLogged === null || lapse.daysSinceLastLogged >= STALE_DAYS;
          return (
            <Link
              key={lapse.setterId}
              href={`/manager/setters/${lapse.setterId}`}
              className="flex flex-wrap items-center justify-between gap-3 py-2.5 transition-colors duration-[var(--duration-fast)] hover:bg-surface-2/60"
            >
              <span className="flex items-center gap-2.5">
                <Avatar name={lapse.setterName} size="sm" />
                <span className="text-sm font-medium text-text-primary">{lapse.setterName}</span>
              </span>
              <span className={cn("text-xs", isStale ? "text-danger" : "text-text-tertiary")}>
                {lapseLabel(lapse.daysSinceLastLogged)}
                {lapse.lastLoggedAt && (
                  <>
                    {" · "}
                    <LocalDateTime
                      iso={lapse.lastLoggedAt.toISOString()}
                      options={{ month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }}
                    />
                  </>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
