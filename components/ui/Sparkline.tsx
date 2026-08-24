"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

/** A single flat point still needs to render as a visible line, not a zero-height blank. */
function normalize(values: number[]): { v: number }[] {
  if (values.every((v) => v === 0)) return values.map(() => ({ v: 0 }));
  return values.map((v) => ({ v }));
}

/** Compact 7-point trend, no axes/labels/tooltip — for a table row, not a dashboard card. */
export function Sparkline({ values, width = 64, height = 24 }: { values: number[]; width?: number; height?: number }) {
  const data = normalize(values);
  const id = `spark-${values.join("-")}`;

  return (
    <div style={{ width, height }} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 1, left: 1, bottom: 2 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke="var(--accent)" strokeWidth={1.5} fill={`url(#${id})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
