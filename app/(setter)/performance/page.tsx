import { requireUser } from "@/lib/auth/dal";
import { getPersonalPerformance } from "@/lib/sessions/performance";
import { MetricDisplay } from "@/components/ui/MetricDisplay";
import { TrendChart } from "@/components/ui/TrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatInt, formatPercent, formatRate, formatSignedPercent, formatDurationCompact } from "@/lib/format/number";

export default async function PerformancePage() {
  const user = await requireUser();
  const perf = await getPersonalPerformance(user.id);

  const relativeDiff =
    perf.metrics.setRateFromConversations !== null && perf.teamAverageSetRate
      ? ((perf.metrics.setRateFromConversations - perf.teamAverageSetRate) / perf.teamAverageSetRate) * 100
      : null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Performance</h1>
        <p className="mt-1 text-sm text-text-tertiary">Your all-time calling performance.</p>
      </div>

      <div className="flex flex-wrap items-end gap-8 rounded-[var(--radius-lg)] border border-border bg-surface-1 p-6">
        <MetricDisplay label="Your Set Rate" value={formatPercent(perf.metrics.setRateFromConversations)} size="lg" tone="positive" />
        <MetricDisplay label="Team Avg" value={formatPercent(perf.teamAverageSetRate)} size="md" tone="muted" />
        {relativeDiff !== null && (
          <MetricDisplay label="vs Team" value={formatSignedPercent(relativeDiff)} size="md" tone={relativeDiff >= 0 ? "positive" : "default"} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricDisplay label="Total Dials" value={formatInt(perf.allTime.dials)} />
        <MetricDisplay label="Total Conversations" value={formatInt(perf.allTime.conversations)} />
        <MetricDisplay label="Total Appointments" value={formatInt(perf.allTime.appointments)} />
        <MetricDisplay label="Sessions" value={formatInt(perf.allTime.sessionsCount)} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricDisplay label="Conv. Rate" value={formatPercent(perf.metrics.conversionRate)} size="sm" />
        <MetricDisplay label="Dials / Hour" value={formatRate(perf.metrics.dialsPerHour)} size="sm" />
        <MetricDisplay label="Conversations / Hour" value={formatRate(perf.metrics.conversationsPerHour)} size="sm" />
        <MetricDisplay label="Appointments / Hour" value={formatRate(perf.metrics.appointmentsPerHour)} size="sm" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>30-day appointment trend</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={perf.dailyTrend} dataKey="appointments" label="Appointments per day" />
        </CardContent>
      </Card>

      {perf.bestSession && (
        <Card>
          <CardHeader>
            <CardTitle>Best session</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-text-primary">{perf.bestSession.leadListName}</p>
              <p className="mt-0.5 text-xs text-text-tertiary">
                {perf.bestSession.startedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div className="flex gap-6">
              <MetricDisplay label="Appointments" value={formatInt(perf.bestSession.appointments)} size="sm" tone="positive" />
              <MetricDisplay label="Set Rate" value={formatPercent(perf.bestSession.setRate)} size="sm" />
            </div>
          </CardContent>
        </Card>
      )}

      {perf.allTime.durationSeconds > 0 && (
        <p className="text-xs text-text-tertiary">
          Total time calling: {formatDurationCompact(perf.allTime.durationSeconds)}
        </p>
      )}
    </div>
  );
}
