import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeadListDetail } from "@/lib/analytics/lead-lists";
import { parseRangeParam, DATE_RANGE_LABELS } from "@/lib/utils/date-range";
import { DateRangeFilter } from "@/components/manager/DateRangeFilter";
import { MetricDisplay } from "@/components/ui/MetricDisplay";
import { TrendChart } from "@/components/ui/TrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatInt, formatPercent } from "@/lib/format/number";

export default async function LeadListDetailPage({ params, searchParams }: PageProps<"/manager/lead-intelligence/[id]">) {
  const { id } = await params;
  const { preset, range } = parseRangeParam(await searchParams);
  const detail = await getLeadListDetail(id, range);
  if (!detail) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{detail.leadList.name}</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            {detail.leadList.source}
            {detail.leadList.location ? ` · ${detail.leadList.location}` : ""} · {DATE_RANGE_LABELS[preset]}
          </p>
        </div>
        <DateRangeFilter />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricDisplay label="Conversations" value={formatInt(detail.totals.conversations)} size="lg" />
        <MetricDisplay label="Appointments" value={formatInt(detail.totals.appointments)} size="lg" tone="positive" />
        <MetricDisplay label="Set Rate" value={formatPercent(detail.metrics.setRateFromConversations)} size="lg" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricDisplay label="DQ" value={formatInt(detail.totals.dq)} size="md" tone="muted" />
        <MetricDisplay label="Wrong Name/Number" value={formatInt(detail.totals.wrongNumber)} size="md" tone="muted" />
        <MetricDisplay label="DQ Rate" value={formatPercent(detail.metrics.dqRate)} size="md" />
        <MetricDisplay label="Wrong # Rate" value={formatPercent(detail.metrics.wrongNumberRate)} size="md" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>30-day trend</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={detail.dailyTrend} dataKey="conversations" label="Conversations per day" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setter performance on this list</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.bySetter.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle">
              {detail.bySetter.map((s) => (
                <Link
                  key={s.id}
                  href={`/manager/setters/${s.id}`}
                  className="flex items-center justify-between py-2.5 hover:text-accent"
                >
                  <span className="text-sm text-text-primary">{s.name}</span>
                  <span className="font-mono text-sm tabular-nums text-text-secondary">{formatPercent(s.setRate)}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
