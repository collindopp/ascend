import Link from "next/link";
import { setRateFromConversations } from "@/lib/metrics/core";
import { formatInt, formatPercent, formatDurationCompact } from "@/lib/format/number";

interface HistorySessionRow {
  id: string;
  leadListName: string;
  startedAt: Date;
  endedAt: Date | null;
  conversations: number;
  appointments: number;
  dq: number;
  wrongNumber: number;
}

export function SessionHistoryList({ sessions }: { sessions: HistorySessionRow[] }) {
  return (
    <div className="flex flex-col divide-y divide-border-subtle rounded-[var(--radius-lg)] border border-border bg-surface-1">
      {sessions.map((session) => {
        const durationSeconds = session.endedAt
          ? Math.max(0, Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000))
          : 0;
        const setRate = setRateFromConversations(session.appointments, session.conversations);
        const flagged = session.dq + session.wrongNumber;

        return (
          <Link
            key={session.id}
            href={`/session/${session.id}`}
            className="flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-[var(--duration-fast)] hover:bg-surface-2/60"
          >
            <div>
              <p className="text-sm font-medium text-text-primary">{session.leadListName}</p>
              <p className="mt-0.5 text-xs text-text-tertiary">
                {session.startedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
                {formatDurationCompact(durationSeconds)}
              </p>
            </div>
            <div className="flex items-center gap-5 text-right font-mono text-sm tabular-nums">
              <div>
                <p className="text-text-secondary">{formatInt(session.conversations)}</p>
                <p className="text-[10px] uppercase tracking-wider text-text-tertiary">Conv</p>
              </div>
              <div>
                <p className="text-text-secondary">{formatInt(session.appointments)}</p>
                <p className="text-[10px] uppercase tracking-wider text-text-tertiary">Appt</p>
              </div>
              <div>
                <p className="text-text-secondary">{formatInt(flagged)}</p>
                <p className="text-[10px] uppercase tracking-wider text-text-tertiary">Flagged</p>
              </div>
              <div>
                <p className="text-accent">{formatPercent(setRate)}</p>
                <p className="text-[10px] uppercase tracking-wider text-text-tertiary">Set Rate</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
