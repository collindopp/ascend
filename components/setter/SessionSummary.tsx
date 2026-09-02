import Link from "next/link";
import { MetricDisplay } from "@/components/ui/MetricDisplay";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { AnimatedRate } from "@/components/ui/AnimatedRate";
import { Button } from "@/components/ui/Button";
import { deriveMetrics } from "@/lib/metrics/core";
import { formatDurationCompact } from "@/lib/format/number";

interface SessionSummaryProps {
  leadListName: string;
  startedAt: Date;
  endedAt: Date;
  dials: number;
  conversations: number;
  appointments: number;
  dq: number;
  wrongNumber: number;
  pickUps: number;
  notInterested: number;
  followUp: number;
}

export function SessionSummary({
  leadListName,
  startedAt,
  endedAt,
  dials,
  conversations,
  appointments,
  dq,
  wrongNumber,
  pickUps,
  notInterested,
  followUp,
}: SessionSummaryProps) {
  const durationSeconds = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
  const metrics = deriveMetrics({ dials, conversations, appointments, dq, wrongNumber, pickUps, notInterested, followUp, durationSeconds });

  return (
    <div className="flex flex-col gap-8">
      <div className="animate-fade-in-up">
        <p className="text-xs font-medium uppercase tracking-wider text-accent">Session complete</p>
        <p className="mt-1 text-sm text-text-tertiary">
          {leadListName} · {formatDurationCompact(durationSeconds)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <MetricDisplay
          label="Conversations"
          value={<AnimatedNumber value={conversations} initialValue={0} durationMs={900} />}
          size="lg"
        />
        <MetricDisplay
          label="Appointments"
          value={<AnimatedNumber value={appointments} initialValue={0} durationMs={900} />}
          size="lg"
          tone="positive"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: "160ms" }}>
        <MetricDisplay
          label="DQ"
          value={<AnimatedNumber value={dq} initialValue={0} durationMs={900} />}
          size="md"
          tone="muted"
        />
        <MetricDisplay
          label="Wrong Name/Number"
          value={<AnimatedNumber value={wrongNumber} initialValue={0} durationMs={900} />}
          size="md"
          tone="muted"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        <MetricDisplay
          label="Pick Ups"
          value={<AnimatedNumber value={pickUps} initialValue={0} durationMs={900} />}
          size="md"
          tone="muted"
        />
        <MetricDisplay
          label="Not Interested"
          value={<AnimatedNumber value={notInterested} initialValue={0} durationMs={900} />}
          size="md"
          tone="muted"
        />
        <MetricDisplay
          label="Follow Up"
          value={<AnimatedNumber value={followUp} initialValue={0} durationMs={900} />}
          size="md"
          tone="muted"
        />
      </div>

      <div
        className="grid grid-cols-2 gap-4 border-t border-border-subtle pt-6 sm:grid-cols-4 animate-fade-in-up"
        style={{ animationDelay: "240ms" }}
      >
        <MetricDisplay
          label="Set Rate"
          value={<AnimatedRate metricValue={metrics.setRateFromConversations} formatType="percent" />}
          size="sm"
        />
        <MetricDisplay label="DQ Rate" value={<AnimatedRate metricValue={metrics.dqRate} formatType="percent" />} size="sm" />
        <MetricDisplay
          label="Wrong # Rate"
          value={<AnimatedRate metricValue={metrics.wrongNumberRate} formatType="percent" />}
          size="sm"
        />
        <MetricDisplay
          label="Appts / Hour"
          value={<AnimatedRate metricValue={metrics.appointmentsPerHour} formatType="rate" />}
          size="sm"
        />
      </div>

      <div className="flex gap-3 pt-2 animate-fade-in-up" style={{ animationDelay: "320ms" }}>
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
