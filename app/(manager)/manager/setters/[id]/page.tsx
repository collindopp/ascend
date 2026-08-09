import { notFound } from "next/navigation";
import { getSetterDetail } from "@/lib/analytics/setters";
import { parseRangeParam, DATE_RANGE_LABELS } from "@/lib/utils/date-range";
import { DateRangeFilter } from "@/components/manager/DateRangeFilter";
import { MetricDisplay } from "@/components/ui/MetricDisplay";
import { TrendChart } from "@/components/ui/TrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatInt, formatPercent, formatRate } from "@/lib/format/number";

export default async function SetterDetailPage({ params, searchParams }: PageProps<"/manager/setters/[id]">) {
  const { id } = await params;
  const { preset, range } = parseRangeParam(await searchParams);
  const detail = await getSetterDetail(id, range);
  if (!detail) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{detail.setter.name}</h1>
          <p className="mt-1 text-sm text-text-tertiary">{DATE_RANGE_LABELS[preset]} · {detail.sessionsCount} sessions</p>
        </div>
        <DateRangeFilter />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricDisplay label="Conversations" value={formatInt(detail.totals.conversations)} size="lg" />
        <MetricDisplay label="Appointments" value={formatInt(detail.totals.appointments)} size="lg" tone="positive" />
        <MetricDisplay label="Set Rate" value={formatPercent(detail.metrics.setRateFromConversations)} size="lg" />
        <MetricDisplay label="Appointments / Hour" value={formatRate(detail.metrics.appointmentsPerHour)} size="lg" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricDisplay label="DQ" value={formatInt(detail.totals.dq)} size="sm" tone="muted" />
        <MetricDisplay label="Wrong #" value={formatInt(detail.totals.wrongNumber)} size="sm" tone="muted" />
        <MetricDisplay label="DQ Rate" value={formatPercent(detail.metrics.dqRate)} size="sm" />
        <MetricDisplay label="Wrong # Rate" value={formatPercent(detail.metrics.wrongNumberRate)} size="sm" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>30-day trend</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={detail.dailyTrend} dataKey="appointments" label="Appointments per day" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Best-performing lead lists</CardTitle>
          </CardHeader>
          <CardContent>
            {detail.bestLeadLists.length === 0 ? (
              <EmptyState title="Not enough data" description="Needs more conversations to rank reliably." />
            ) : (
              <div className="flex flex-col divide-y divide-border-subtle">
                {detail.bestLeadLists.map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-text-primary">{l.name}</span>
                    <span className="font-mono text-sm tabular-nums text-accent">{formatPercent(l.setRate)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Worst-performing lead lists</CardTitle>
          </CardHeader>
          <CardContent>
            {detail.worstLeadLists.length === 0 ? (
              <EmptyState title="Not enough data" description="Needs more conversations to rank reliably." />
            ) : (
              <div className="flex flex-col divide-y divide-border-subtle">
                {detail.worstLeadLists.map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-text-primary">{l.name}</span>
                    <span className="font-mono text-sm tabular-nums text-text-secondary">{formatPercent(l.setRate)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
