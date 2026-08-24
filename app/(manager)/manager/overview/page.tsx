import Link from "next/link";
import { getTeamOverview } from "@/lib/analytics/overview";
import { getOverviewInsights } from "@/lib/analytics/insights";
import { parseRangeParam, DATE_RANGE_LABELS } from "@/lib/utils/date-range";
import { DateRangeFilter } from "@/components/manager/DateRangeFilter";
import { MetricDisplay } from "@/components/ui/MetricDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { formatInt, formatPercent, formatRate } from "@/lib/format/number";
import { dqRateTone, wrongNumberRateTone } from "@/lib/format/tone";

export default async function OverviewPage({ searchParams }: PageProps<"/manager/overview">) {
  const params = await searchParams;
  const { preset, range } = parseRangeParam(params);
  const data = await getTeamOverview(range);
  const insights = await getOverviewInsights(range, DATE_RANGE_LABELS[preset].toLowerCase());

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Overview</h1>
          <p className="mt-1 text-sm text-text-tertiary">Team performance — {DATE_RANGE_LABELS[preset]}.</p>
        </div>
        <DateRangeFilter />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <MetricDisplay label="Total Conversations" value={formatInt(data.totals.conversations)} size="lg" />
        <MetricDisplay label="Total Appointments" value={formatInt(data.totals.appointments)} size="lg" tone="positive" />
        <MetricDisplay label="Text Appointments" value={formatInt(data.textAppointments)} size="lg" tone="positive" />
        <MetricDisplay label="Total DQ" value={formatInt(data.totals.dq)} size="lg" tone="muted" />
        <MetricDisplay label="Total Wrong #" value={formatInt(data.totals.wrongNumber)} size="lg" tone="muted" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricDisplay label="Team Set Rate" value={formatPercent(data.metrics.setRateFromConversations)} size="sm" />
        <MetricDisplay
          label="Team DQ Rate"
          value={formatPercent(data.metrics.dqRate)}
          size="sm"
          tone={dqRateTone(data.metrics.dqRate)}
        />
        <MetricDisplay
          label="Team Wrong # Rate"
          value={formatPercent(data.metrics.wrongNumberRate)}
          size="sm"
          tone={wrongNumberRateTone(data.metrics.wrongNumberRate)}
        />
        <MetricDisplay label="Appointments / Hour" value={formatRate(data.metrics.appointmentsPerHour)} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricDisplay label="Active Sessions Now" value={formatInt(data.activeSessionsCount)} size="sm" tone="muted" />
        <MetricDisplay label="Setters Active" value={formatInt(data.settersActiveInRange)} size="sm" tone="muted" />
        <MetricDisplay label="Sessions" value={formatInt(data.sessionsCount)} size="sm" tone="muted" />
      </div>

      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {insights.map((insight) => (
                <li key={insight.id} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
                  {insight.text}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Top setters by appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topSetters.length === 0 ? (
            <EmptyState title="No activity yet" description="Sessions in this date range will appear here." />
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle">
              {data.topSetters.map((setter, i) => (
                <Link
                  key={setter.id}
                  href={`/manager/setters/${setter.id}`}
                  className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-text-primary"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-4 font-mono text-xs text-text-tertiary">{i + 1}</span>
                    <Avatar name={setter.name} size="sm" />
                    <span className="text-sm text-text-primary">{setter.name}</span>
                  </div>
                  <span className="font-mono text-sm tabular-nums text-accent">{formatInt(setter.appointments)}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
