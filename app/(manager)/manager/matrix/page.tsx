import { getMatrixData, MATRIX_KPIS, MATRIX_KPI_LABELS, MATRIX_INVERSE_KPIS, type MatrixKpi } from "@/lib/analytics/matrix";
import { parseRangeParam, DATE_RANGE_LABELS } from "@/lib/utils/date-range";
import { DateRangeFilter } from "@/components/manager/DateRangeFilter";
import { KpiSelect } from "@/components/manager/KpiSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatInt, formatPercent, formatRate } from "@/lib/format/number";
import { cn } from "@/lib/utils/cn";

function formatValue(kpi: MatrixKpi, value: number | null): string {
  if (value === null) return "—";
  if (kpi === "setRate" || kpi === "dqRate" || kpi === "wrongNumberRate") return formatPercent(value);
  if (kpi === "appointments") return formatInt(value);
  return formatRate(value);
}

export default async function MatrixPage({ searchParams }: PageProps<"/manager/matrix">) {
  const params = await searchParams;
  const { preset, range } = parseRangeParam(params);
  const rawKpi = Array.isArray(params.kpi) ? params.kpi[0] : params.kpi;
  const kpi: MatrixKpi = (MATRIX_KPIS as readonly string[]).includes(rawKpi ?? "") ? (rawKpi as MatrixKpi) : "setRate";
  const isInverse = MATRIX_INVERSE_KPIS.has(kpi);

  const { setters, grid } = await getMatrixData(range, kpi);

  const allValues = grid.flatMap((row) => row.values.map((v) => v.value)).filter((v): v is number => v !== null);
  const max = allValues.length > 0 ? Math.max(...allValues) : 0;
  const min = allValues.length > 0 ? Math.min(...allValues) : 0;

  function intensity(value: number | null): number {
    if (value === null || max === min) return 0;
    return (value - min) / (max - min);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Setter × Lead List Matrix</h1>
          <p className="mt-1 text-sm text-text-tertiary">{DATE_RANGE_LABELS[preset]}. Cell intensity reflects relative magnitude.</p>
        </div>
        <div className="flex items-center gap-2">
          <KpiSelect options={MATRIX_KPIS} labels={MATRIX_KPI_LABELS} paramName="kpi" />
          <DateRangeFilter />
        </div>
      </div>

      {setters.length === 0 || grid.length === 0 ? (
        <EmptyState title="Not enough data" description="No setters or lead lists with activity in this range." />
      ) : (
        <div className="w-full overflow-x-auto rounded-[var(--radius-lg)] border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="sticky left-0 z-10 bg-surface-1 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Lead List
                </th>
                {setters.map((s) => (
                  <th
                    key={s.id}
                    className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-tertiary whitespace-nowrap"
                  >
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {grid.map((row) => (
                <tr key={row.leadListId}>
                  <td className="sticky left-0 z-10 bg-surface-1 px-4 py-3 font-medium text-text-primary whitespace-nowrap">
                    {row.leadListName}
                  </td>
                  {row.values.map((cell) => {
                    const t = intensity(cell.value);
                    const heatColor = isInverse ? "var(--danger)" : "var(--accent)";
                    return (
                      <td
                        key={cell.setterId}
                        className="px-4 py-3 text-right font-mono tabular-nums"
                        style={
                          cell.value !== null
                            ? { backgroundColor: `color-mix(in oklab, ${heatColor} ${Math.round(t * 35)}%, transparent)` }
                            : undefined
                        }
                      >
                        <span className={cn(cell.value !== null ? "text-text-primary" : "text-text-disabled")}>
                          {formatValue(kpi, cell.value)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
