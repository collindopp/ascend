"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { recordEventAction, undoLastEventAction, endSessionAction } from "@/lib/sessions/actions";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { MetricDisplay } from "@/components/ui/MetricDisplay";
import { formatDuration, formatInt } from "@/lib/format/number";

interface SessionCounts {
  conversations: number;
  appointments: number;
  dq: number;
  wrongNumber: number;
  pickUps: number;
  notInterested: number;
  followUp: number;
}

interface ActiveSessionViewProps {
  sessionId: string;
  leadListName: string;
  startedAt: string; // ISO
  initialCounts: SessionCounts;
}

type EventType = "CONVERSATION" | "APPOINTMENT" | "DQ" | "WRONG_NUMBER" | "PICK_UP" | "NOT_INTERESTED" | "FOLLOW_UP";

const FIELD_FOR_TYPE: Record<EventType, keyof SessionCounts> = {
  CONVERSATION: "conversations",
  APPOINTMENT: "appointments",
  DQ: "dq",
  WRONG_NUMBER: "wrongNumber",
  PICK_UP: "pickUps",
  NOT_INTERESTED: "notInterested",
  FOLLOW_UP: "followUp",
};

type PopKeys = Record<keyof SessionCounts, number>;

export function ActiveSessionView({ sessionId, leadListName, startedAt, initialCounts }: ActiveSessionViewProps) {
  const router = useRouter();
  const toast = useToast();
  const [counts, setCounts] = useState(initialCounts);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  // Bumped on every tap for a field so its number can remount and replay the
  // pop animation, even on rapid consecutive taps of the same button.
  const [popKeys, setPopKeys] = useState<PopKeys>({
    conversations: 0,
    appointments: 0,
    dq: 0,
    wrongNumber: 0,
    pickUps: 0,
    notInterested: 0,
    followUp: 0,
  });
  const [, startTransition] = useTransition();

  useEffect(() => {
    const startedAtMs = new Date(startedAt).getTime();
    const tick = () => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const handleTap = useCallback(
    (type: EventType) => {
      const field = FIELD_FOR_TYPE[type];
      setCounts((prev) => ({ ...prev, [field]: prev[field] + 1 }));
      setPopKeys((prev) => ({ ...prev, [field]: prev[field] + 1 }));

      startTransition(async () => {
        const result = await recordEventAction({ sessionId, type });
        if (!result.ok) {
          setCounts((prev) => ({ ...prev, [field]: Math.max(0, prev[field] - 1) }));
          toast.push({ title: "Couldn't record that", description: result.error, tone: "error" });
          return;
        }
        setCounts(result.data);
      });
    },
    [sessionId, toast],
  );

  function handleUndo() {
    setIsUndoing(true);
    startTransition(async () => {
      const result = await undoLastEventAction({ sessionId });
      setIsUndoing(false);
      if (!result.ok) {
        toast.push({ title: "Nothing to undo", description: result.error, tone: "default" });
        return;
      }
      const { undone, ...updatedCounts } = result.data;
      setCounts(updatedCounts);
      if (undone) {
        toast.push({ title: `Undid last ${undone.toLowerCase().replace("_", " ")}`, tone: "default" });
      }
    });
  }

  function handleEndSession() {
    setIsEnding(true);
    startTransition(async () => {
      const result = await endSessionAction({ sessionId });
      if (!result.ok) {
        setIsEnding(false);
        toast.push({ title: "Couldn't end session", description: result.error, tone: "error" });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in-up">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">{leadListName}</p>
      </div>

      <MetricDisplay
        label={
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-live-pulse" aria-hidden />
            Session Time
          </span>
        }
        value={formatDuration(elapsedSeconds)}
        size="xl"
      />

      <div className="grid grid-cols-2 gap-4 border-y border-border-subtle py-5">
        <MetricDisplay
          label="Conversations"
          value={
            <span key={popKeys.conversations} className="inline-block animate-counter-pop">
              {formatInt(counts.conversations)}
            </span>
          }
          size="md"
        />
        <MetricDisplay
          label="Appointments"
          value={
            <span key={popKeys.appointments} className="inline-block animate-counter-pop">
              {formatInt(counts.appointments)}
            </span>
          }
          size="md"
          tone="positive"
        />
      </div>

      <Button size="lg" variant="secondary" onClick={() => handleTap("PICK_UP")} className="w-full flex-col gap-1">
        <span>Pick Up</span>
        <span key={popKeys.pickUps} className="inline-block animate-counter-pop font-mono text-xs text-text-tertiary tabular-nums">
          {formatInt(counts.pickUps)}
        </span>
      </Button>

      <div className="grid grid-cols-2 gap-3">
        <Button size="xl" variant="secondary" onClick={() => handleTap("CONVERSATION")} className="flex-col gap-1">
          <span>Conversation</span>
        </Button>
        <Button size="xl" variant="primary" onClick={() => handleTap("APPOINTMENT")} className="flex-col gap-1">
          <span>Appointment</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button size="lg" variant="secondary" onClick={() => handleTap("DQ")} className="flex-col gap-1">
          <span>DQ</span>
          <span key={popKeys.dq} className="inline-block animate-counter-pop font-mono text-xs text-text-tertiary tabular-nums">
            {formatInt(counts.dq)}
          </span>
        </Button>
        <Button size="lg" variant="secondary" onClick={() => handleTap("WRONG_NUMBER")} className="flex-col gap-1">
          <span>Wrong Name/Number</span>
          <span
            key={popKeys.wrongNumber}
            className="inline-block animate-counter-pop font-mono text-xs text-text-tertiary tabular-nums"
          >
            {formatInt(counts.wrongNumber)}
          </span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button size="lg" variant="secondary" onClick={() => handleTap("NOT_INTERESTED")} className="flex-col gap-1">
          <span>Not Interested</span>
          <span
            key={popKeys.notInterested}
            className="inline-block animate-counter-pop font-mono text-xs text-text-tertiary tabular-nums"
          >
            {formatInt(counts.notInterested)}
          </span>
        </Button>
        <Button size="lg" variant="secondary" onClick={() => handleTap("FOLLOW_UP")} className="flex-col gap-1">
          <span>Follow Up</span>
          <span
            key={popKeys.followUp}
            className="inline-block animate-counter-pop font-mono text-xs text-text-tertiary tabular-nums"
          >
            {formatInt(counts.followUp)}
          </span>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button variant="ghost" size="md" onClick={handleUndo} disabled={isUndoing}>
          {isUndoing ? "Undoing…" : "Undo"}
        </Button>
        <Button variant="danger" size="md" onClick={handleEndSession} disabled={isEnding}>
          {isEnding ? "Ending…" : "End session"}
        </Button>
      </div>
    </div>
  );
}
