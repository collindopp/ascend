"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchActiveNow } from "@/lib/analytics/activity-live";
import type { ActiveNowRow } from "@/lib/analytics/activity";
import { Badge } from "@/components/ui/Badge";
import { formatDurationCompact, formatInt } from "@/lib/format/number";
import { cn } from "@/lib/utils/cn";

const POLL_INTERVAL_MS = 10000;

function formatIdle(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export function ActiveNowPanel({ initialRows }: { initialRows: ActiveNowRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [updatedAt, setUpdatedAt] = useState(() => Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const refresh = useCallback(async () => {
    const result = await fetchActiveNow();
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

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface-1 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-text-primary">Active Now</h2>
        <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-live-pulse" aria-hidden />
          <span>Live · {secondsAgo < 2 ? "just now" : `${secondsAgo}s ago`}</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-tertiary">No one is on a call right now.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle">
          {rows.map((row) => (
            <Link
              key={row.sessionId}
              href={`/manager/setters/${row.setterId}`}
              className="flex flex-wrap items-center justify-between gap-3 py-3 transition-colors duration-[var(--duration-fast)] hover:bg-surface-2/60"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-text-primary">{row.setterName}</span>
                <span className="text-xs text-text-tertiary">{row.leadListName}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs tabular-nums text-text-secondary">
                  {formatInt(row.conversations)} conv · {formatInt(row.appointments)} appt
                </span>
                <span className="font-mono text-xs tabular-nums text-text-tertiary">
                  {formatDurationCompact(row.durationSeconds)}
                </span>
                <Badge tone={row.isIdle ? "warning" : "positive"} className={cn(row.isIdle && "animate-pulse")}>
                  {row.isIdle ? `Idle ${formatIdle(row.idleMinutes)}` : "Working"}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
