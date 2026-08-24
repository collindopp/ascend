"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  LEADERBOARD_KPI_LABELS,
  type LeaderboardKpi,
} from "@/lib/analytics/leaderboard-kpis";
import { fetchLiveLeaderboard, type LiveLeaderboardRow } from "@/lib/analytics/leaderboard-live";
import { DATE_RANGE_LABELS, type DateRangePreset } from "@/lib/utils/date-range";
import { formatInt, formatPercent, formatRate } from "@/lib/format/number";
import { cn } from "@/lib/utils/cn";

const POLL_INTERVAL_MS = 8000;

function formatValue(kpi: LeaderboardKpi, value: number | null): string {
  if (value === null) return "—";
  if (kpi === "setRate") return formatPercent(value);
  if (kpi === "appointments" || kpi === "conversations" || kpi === "textAppointments") return formatInt(value);
  return formatRate(value);
}

interface Row extends LiveLeaderboardRow {
  rank: number;
  delta: number | null; // positions moved up (+) or down (-) since last poll; null = just entered
  flash: boolean;
}

function withRankAndDelta(data: LiveLeaderboardRow[], previousRanks: Map<string, number>): Row[] {
  const sorted = [...data].sort((a, b) => {
    if (a.rankValue === null && b.rankValue === null) return 0;
    if (a.rankValue === null) return 1;
    if (b.rankValue === null) return -1;
    return b.rankValue - a.rankValue;
  });

  return sorted.map((row, i) => {
    const rank = i + 1;
    const prevRank = previousRanks.get(row.id);
    return {
      ...row,
      rank,
      delta: prevRank === undefined ? null : prevRank - rank,
      flash: false,
    };
  });
}

interface LiveLeaderboardProps {
  initialRows: LiveLeaderboardRow[];
  initialKpi: LeaderboardKpi;
  kpiOptions: readonly LeaderboardKpi[];
  initialPreset: DateRangePreset;
  presetOptions: readonly DateRangePreset[];
  viewerId?: string;
  linkToSetterDetail?: boolean;
}

export function LiveLeaderboard({
  initialRows,
  initialKpi,
  kpiOptions,
  initialPreset,
  presetOptions,
  viewerId,
  linkToSetterDetail = false,
}: LiveLeaderboardProps) {
  const [kpi, setKpi] = useState(initialKpi);
  const [preset, setPreset] = useState(initialPreset);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally computed once from the SSR-provided initial props
  const initialRanked = useMemo(() => withRankAndDelta(initialRows, new Map()), []);
  const previousRanksRef = useRef<Map<string, number>>(new Map(initialRanked.map((r) => [r.id, r.rank])));
  const previousValuesRef = useRef<Map<string, number | null>>(new Map(initialRanked.map((r) => [r.id, r.rankValue])));
  const isFirstEffectRun = useRef(true);
  const [rows, setRows] = useState<Row[]>(initialRanked);
  const [updatedAt, setUpdatedAt] = useState(() => Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const refresh = useCallback(
    async (nextKpi: LeaderboardKpi, nextPreset: DateRangePreset) => {
      const result = await fetchLiveLeaderboard(nextPreset, nextKpi);
      if (!result.ok) return;

      const withRanks = withRankAndDelta(result.data, previousRanksRef.current);
      const withFlash = withRanks.map((row) => ({
        ...row,
        flash: previousValuesRef.current.get(row.id) !== undefined && previousValuesRef.current.get(row.id) !== row.rankValue,
      }));

      previousRanksRef.current = new Map(withRanks.map((r) => [r.id, r.rank]));
      previousValuesRef.current = new Map(withRanks.map((r) => [r.id, r.rankValue]));

      setRows(withFlash);
      setUpdatedAt(Date.now());
    },
    [],
  );

  // Re-fetch whenever the KPI or range changes (reset movement tracking — comparing
  // positions across two different KPIs would be meaningless). Skips the very first
  // run since the server-rendered initialRows already seeded state and the refs above.
  useEffect(() => {
    if (isFirstEffectRun.current) {
      isFirstEffectRun.current = false;
      return;
    }
    previousRanksRef.current = new Map();
    previousValuesRef.current = new Map();
    refresh(kpi, preset);
  }, [kpi, preset, refresh]);

  // Poll on an interval, paused while the tab isn't visible.
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      refresh(kpi, preset);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [kpi, preset, refresh]);

  // "Updated Ns ago" ticker.
  useEffect(() => {
    const interval = setInterval(() => setSecondsAgo(Math.max(0, Math.round((Date.now() - updatedAt) / 1000))), 1000);
    return () => clearInterval(interval);
  }, [updatedAt]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {kpiOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setKpi(opt)}
              className={cn(
                "h-8 rounded-full px-3 text-xs font-medium transition-colors duration-[var(--duration-fast)]",
                opt === kpi
                  ? "bg-accent text-black"
                  : "bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary",
              )}
            >
              {LEADERBOARD_KPI_LABELS[opt]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {presetOptions.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {presetOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setPreset(opt)}
                  className={cn(
                    "h-8 rounded-full px-3 text-xs font-medium transition-colors duration-[var(--duration-fast)]",
                    opt === preset
                      ? "bg-surface-3 text-text-primary"
                      : "bg-transparent text-text-tertiary hover:text-text-primary",
                  )}
                >
                  {DATE_RANGE_LABELS[opt]}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-live-pulse" aria-hidden />
            <span>Live · {secondsAgo < 2 ? "just now" : `${secondsAgo}s ago`}</span>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border px-6 py-16 text-center">
          <p className="text-sm text-text-tertiary">No activity yet for {DATE_RANGE_LABELS[preset].toLowerCase()}.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle rounded-[var(--radius-lg)] border border-border bg-surface-1">
          {rows.map((row) => {
            const isYou = viewerId && row.id === viewerId;
            const content = (
              <div
                className={cn(
                  "flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-[var(--duration-fast)]",
                  linkToSetterDetail && "hover:bg-surface-2/60",
                  isYou && "bg-accent-muted/40",
                  row.flash && "animate-row-flash",
                )}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold tabular-nums",
                      row.rank === 1 && "bg-accent text-black",
                      row.rank === 2 && "border border-accent-border text-accent",
                      row.rank === 3 && "border border-border-strong text-text-secondary",
                      row.rank > 3 && "text-text-tertiary",
                      row.flash && "animate-rank-pop",
                    )}
                  >
                    {row.rank}
                  </span>
                  <span className={cn("text-sm font-medium", isYou ? "text-accent" : "text-text-primary")}>
                    {row.name}
                    {isYou && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-accent">You</span>}
                  </span>
                  {row.delta !== null && row.delta !== 0 && (
                    <span
                      className={cn(
                        "flex items-center gap-0.5 font-mono text-xs tabular-nums",
                        row.delta > 0 ? "text-accent" : "text-text-tertiary",
                      )}
                    >
                      {row.delta > 0 ? "▲" : "▼"}
                      {Math.abs(row.delta)}
                    </span>
                  )}
                </div>
                <span className="font-mono text-base tabular-nums text-text-primary">{formatValue(kpi, row.rankValue)}</span>
              </div>
            );

            return linkToSetterDetail ? (
              <Link key={row.id} href={`/manager/setters/${row.id}`}>
                {content}
              </Link>
            ) : (
              <div key={row.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
