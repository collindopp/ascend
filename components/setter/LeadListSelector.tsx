"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startSessionAction } from "@/lib/sessions/actions";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { LogTextAppointmentButton } from "@/components/setter/LogTextAppointmentButton";
import { formatPercent, formatInt } from "@/lib/format/number";
import type { LeadListWithStats } from "@/lib/lead-lists/queries";

const MAX_STAGGER_MS = 300;

export function LeadListSelector({ leadLists }: { leadLists: LeadListWithStats[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelect(leadListId: string) {
    setPendingId(leadListId);
    startTransition(async () => {
      const result = await startSessionAction({ leadListId });
      if (!result.ok) {
        toast.push({ title: "Couldn't start session", description: result.error, tone: "error" });
        setPendingId(null);
        return;
      }
      router.push(`/session/${result.data.sessionId}`);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {leadLists.map((list, i) => (
        <div
          key={list.id}
          className="flex flex-col justify-between gap-4 rounded-[var(--radius-lg)] border border-border bg-surface-1 p-5 animate-fade-in-up transition-[transform,border-color] duration-[var(--duration-base)] hover:-translate-y-0.5 hover:border-border-strong"
          style={{ animationDelay: `${Math.min(i * 50, MAX_STAGGER_MS)}ms` }}
        >
          <div>
            <p className="text-sm font-medium text-text-primary">{list.name}</p>
            <p className="mt-0.5 text-xs text-text-tertiary">
              {list.source}
              {list.location ? ` · ${list.location}` : ""}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">Leads</p>
                <p className="mt-0.5 font-mono text-sm text-text-secondary">
                  {list.leadCount !== null ? formatInt(list.leadCount) : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">Set Rate</p>
                <p className="mt-0.5 font-mono text-sm text-text-secondary">{formatPercent(list.setRate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">DQ Rate</p>
                <p className="mt-0.5 font-mono text-sm text-text-secondary">{formatPercent(list.dqRate)}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => handleSelect(list.id)} disabled={isPending} variant="primary" className="w-full">
              {isPending && pendingId === list.id ? "Starting…" : "Start session"}
            </Button>
            <LogTextAppointmentButton leadListId={list.id} leadListName={list.name} />
          </div>
        </div>
      ))}
    </div>
  );
}
