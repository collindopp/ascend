import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import type { DailyTimeRow } from "@/lib/analytics/time-worked";
import { EXPECTED_HOURS_PER_DAY } from "@/lib/analytics/time-worked";
import { cn } from "@/lib/utils/cn";

export function DailyTimeWorkedGrid({ rows }: { rows: DailyTimeRow[] }) {
  if (rows.length === 0) return null;
  const days = rows[0]!.days;

  return (
    <div className="w-full overflow-x-auto rounded-[var(--radius-lg)] border border-border shadow-[var(--shadow-card)]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="sticky left-0 z-10 bg-surface-1 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
              Rep
            </th>
            {days.map((d) => (
              <th key={d.date} className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-tertiary whitespace-nowrap">
                {d.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {rows.map((row) => (
            <tr key={row.setterId}>
              <td className="sticky left-0 z-10 bg-surface-1 px-4 py-3 font-medium text-text-primary whitespace-nowrap">
                <Link href={`/manager/setters/${row.setterId}`} className="flex items-center gap-2.5 hover:text-accent">
                  <Avatar name={row.setterName} size="sm" />
                  {row.setterName}
                </Link>
              </td>
              {row.days.map((cell) => {
                const intensity = Math.min(cell.hours / EXPECTED_HOURS_PER_DAY, 1);
                const isGap = cell.hours === 0;
                return (
                  <td
                    key={cell.date}
                    className="px-2 py-3 text-center font-mono tabular-nums"
                    style={
                      !isGap
                        ? { backgroundColor: `color-mix(in oklab, var(--accent) ${Math.round(intensity * 35)}%, transparent)` }
                        : undefined
                    }
                  >
                    <span className={cn(isGap ? "text-danger" : "text-text-primary")}>
                      {isGap ? "—" : cell.hours.toFixed(1)}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
