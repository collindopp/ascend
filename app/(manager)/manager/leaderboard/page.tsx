import Link from "next/link";
import { getLeaderboardRows, LEADERBOARD_KPIS, LEADERBOARD_KPI_LABELS, type LeaderboardKpi } from "@/lib/analytics/leaderboard";
import { parseRangeParam, DATE_RANGE_LABELS } from "@/lib/utils/date-range";
import { DateRangeFilter } from "@/components/manager/DateRangeFilter";
import { KpiSelect } from "@/components/manager/KpiSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatInt, formatPercent, formatRate } from "@/lib/format/number";
import { cn } from "@/lib/utils/cn";

function formatRankValue(kpi: LeaderboardKpi, value: number | null): string {
  if (value === null) return "—";
  if (kpi === "setRate") return formatPercent(value);
  if (kpi === "appointments" || kpi === "conversations" || kpi === "dials") return formatInt(value);
  return formatRate(value);
}

export default async function LeaderboardPage({ searchParams }: PageProps<"/manager/leaderboard">) {
  const params = await searchParams;
  const { preset, range } = parseRangeParam(params);
  const rawKpi = Array.isArray(params.kpi) ? params.kpi[0] : params.kpi;
  const kpi: LeaderboardKpi = (LEADERBOARD_KPIS as readonly string[]).includes(rawKpi ?? "") ? (rawKpi as LeaderboardKpi) : "appointments";

  const rows = await getLeaderboardRows(range, kpi);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Leaderboard</h1>
          <p className="mt-1 text-sm text-text-tertiary">{DATE_RANGE_LABELS[preset]}.</p>
        </div>
        <div className="flex items-center gap-2">
          <KpiSelect options={LEADERBOARD_KPIS} labels={LEADERBOARD_KPI_LABELS} paramName="kpi" />
          <DateRangeFilter />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No activity in this range" />
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle rounded-[var(--radius-lg)] border border-border bg-surface-1">
          {rows.map((row, i) => (
            <Link
              key={row.id}
              href={`/manager/setters/${row.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-[var(--duration-fast)] hover:bg-surface-2/60"
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "w-6 text-right font-mono text-sm tabular-nums",
                    i === 0 ? "text-accent" : "text-text-tertiary",
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-text-primary">{row.name}</span>
              </div>
              <span className="font-mono text-base tabular-nums text-text-primary">
                {formatRankValue(kpi, row.rankValue)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
