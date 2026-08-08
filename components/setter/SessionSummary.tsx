import Link from "next/link";
import { MetricDisplay } from "@/components/ui/MetricDisplay";
import { Button } from "@/components/ui/Button";
import { deriveMetrics } from "@/lib/metrics/core";
import { formatInt, formatPercent, formatRate, formatDurationCompact } from "@/lib/format/number";

interface SessionSummaryProps {
  leadListName: string;
  startedAt: Date;
  endedAt: Date;
  dials: number;
  conversations: number;
  appointments: number;
}

export function SessionSummary({ leadListName, startedAt, endedAt, dials, conversations, appointments }: SessionSummaryProps) {
  const durationSeconds = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
  const metrics = deriveMetrics({ dials, conversations, appointments, durationSeconds });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-accent">Session complete</p>
        <p className="mt-1 text-sm text-text-tertiary">
          {leadListName} · {formatDurationCompact(durationSeconds)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricDisplay label="Dials" value={formatInt(dials)} size="lg" />
        <MetricDisplay label="Conversations" value={formatInt(conversations)} size="lg" />
        <MetricDisplay label="Appointments" value={formatInt(appointments)} size="lg" tone="positive" />
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-border-subtle pt-6 sm:grid-cols-4">
        <MetricDisplay label="Conv. Rate" value={formatPercent(metrics.conversionRate)} size="sm" />
        <MetricDisplay label="Set Rate / Conv" value={formatPercent(metrics.setRateFromConversations)} size="sm" />
        <MetricDisplay label="Set Rate / Dial" value={formatPercent(metrics.setRateFromDials)} size="sm" />
        <MetricDisplay label="Appts / Hour" value={formatRate(metrics.appointmentsPerHour)} size="sm" />
      </div>

      <div className="flex gap-3 pt-2">
        <Link href="/home">
          <Button variant="primary">Start another session</Button>
        </Link>
        <Link href="/history">
          <Button variant="secondary">View history</Button>
        </Link>
      </div>
    </div>
  );
}
