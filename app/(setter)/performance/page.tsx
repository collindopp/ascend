import { requireUser } from "@/lib/auth/dal";
import { getPersonalPerformance } from "@/lib/sessions/performance";
import { MetricDisplay } from "@/components/ui/MetricDisplay";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { AnimatedRate } from "@/components/ui/AnimatedRate";
import { TrendChart } from "@/components/ui/TrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatInt, formatPercent, formatDurationCompact } from "@/lib/format/number";

export default async function PerformancePage() {
  const user = await requireUser();
  const perf = await getPersonalPerformance(user.id);

  const relativeDiff =
    perf.metrics.setRateFromConversations !== null && perf.teamAverageSetRate
      ? ((perf.metrics.setRateFromConversations - perf.teamAverageSetRate) / perf.teamAverageSetRate) * 100
      : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="animate-fade-in-up">
        <h1 className="text-lg font-semibold text-text-primary">Performance</h1>
        <p className="mt-1 text-sm text-text-tertiary">Your all-time calling performance.</p>
      </div>

      <div
        className="flex flex-wrap items-end gap-8 rounded-[var(--radius-lg)] border border-border bg-surface-1 p-6 animate-fade-in-up"
        style={{ animationDelay: "60ms" }}
      >
        <MetricDisplay
          label="Your Set Rate"
          value={<AnimatedRate metricValue={perf.metrics.setRateFromConversations} formatType="percent" />}
          size="lg"
          tone="positive"
        />
        <MetricDisplay
          label="Team Avg"
          value={<AnimatedRate metricValue={perf.teamAverageSetRate} formatType="percent" />}
          size="md"
          tone="muted"
        />
        {relativeDiff !== null && (
          <MetricDisplay
            label="vs Team"
            value={<AnimatedRate metricValue={relativeDiff} formatType="signedPercent" />}
            size="md"
            tone={relativeDiff >= 0 ? "positive" : "default"}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <MetricDisplay label="Total Conversations" value={<AnimatedNumber value={perf.allTime.conversations} initialValue={0} />} />
        <MetricDisplay
          label="Total Appointments"
          value={<AnimatedNumber value={perf.allTime.appointments} initialValue={0} />}
          tone="positive"
        />
        <MetricDisplay label="DQ" value={<AnimatedNumber value={perf.allTime.dq} initialValue={0} />} tone="muted" />
        <MetricDisplay label="Wrong #" value={<AnimatedNumber value={perf.allTime.wrongNumber} initialValue={0} />} tone="muted" />
      </div>

      <div className="grid grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
        <MetricDisplay label="Pick Ups" value={<AnimatedNumber value={perf.extras.pickUps} initialValue={0} />} tone="muted" />
        <MetricDisplay
          label="Not Interested"
          value={<AnimatedNumber value={perf.extras.notInterested} initialValue={0} />}
          tone="muted"
        />
        <MetricDisplay label="Follow Up" value={<AnimatedNumber value={perf.extras.followUp} initialValue={0} />} tone="muted" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
        <MetricDisplay label="DQ Rate" value={<AnimatedRate metricValue={perf.metrics.dqRate} formatType="percent" />} size="sm" />
        <MetricDisplay
          label="Wrong # Rate"
          value={<AnimatedRate metricValue={perf.metrics.wrongNumberRate} formatType="percent" />}
          size="sm"
        />
        <MetricDisplay
          label="Conversations / Hour"
          value={<AnimatedRate metricValue={perf.metrics.conversationsPerHour} formatType="rate" />}
          size="sm"
        />
        <MetricDisplay
          label="Appointments / Hour"
          value={<AnimatedRate metricValue={perf.metrics.appointmentsPerHour} formatType="rate" />}
          size="sm"
        />
      </div>

      <Card className="animate-fade-in-up" style={{ animationDelay: "240ms" }}>
        <CardHeader>
          <CardTitle>30-day appointment trend</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={perf.dailyTrend} dataKey="appointments" label="Appointments per day" />
        </CardContent>
      </Card>

      {perf.bestSession && (
        <Card className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
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
        <p className="text-xs text-text-tertiary animate-fade-in-up" style={{ animationDelay: "340ms" }}>
          Total time calling: {formatDurationCompact(perf.allTime.durationSeconds)} · {formatInt(perf.allTime.sessionsCount)} sessions
        </p>
      )}
    </div>
  );
}
