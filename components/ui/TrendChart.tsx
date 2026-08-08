"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatInt } from "@/lib/format/number";

interface TrendChartProps {
  data: Array<Record<string, number | string>>;
  dataKey: string;
  xKey?: string;
  label: string;
  height?: number;
}

interface TooltipPayloadEntry {
  value?: number;
  payload?: Record<string, number | string>;
}

function ChartTooltip({
  active,
  payload,
  label,
  xKey,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  xKey: string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="rounded-[var(--radius-sm)] border border-border bg-surface-2 px-3 py-2 shadow-lg">
      <p className="text-xs text-text-tertiary">{payload[0]?.payload?.[xKey] ?? label}</p>
      <p className="font-mono text-sm font-medium tabular-nums text-text-primary">{formatInt(Number(value))}</p>
    </div>
  );
}

/** Single-series trend area chart — one hue (the brand accent), no legend needed for one series. */
export function TrendChart({ data, dataKey, xKey = "date", label, height = 160 }: TrendChartProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">{label}</p>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="0" />
          <XAxis
            dataKey={xKey}
            tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={32}
          />
          <YAxis
            tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={32}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltip xKey={xKey} />} cursor={{ stroke: "var(--border-strong)" }} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#trendFill)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--accent)", stroke: "var(--surface-1)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
