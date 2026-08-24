"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setWeeklyGoalAction } from "@/lib/goals/actions";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { TableRow, TableCell } from "@/components/ui/Table";
import { Avatar } from "@/components/ui/Avatar";
import { formatInt } from "@/lib/format/number";

interface WeeklyGoalRowProps {
  setterId: string;
  setterName: string;
  currentSets: number;
  initialTarget: number | null;
}

export function WeeklyGoalRow({ setterId, setterName, currentSets, initialTarget }: WeeklyGoalRowProps) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState(initialTarget !== null ? String(initialTarget) : "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await setWeeklyGoalAction({ setterId, target: value === "" ? 0 : Number(value) });
      if (!result.ok) {
        toast.push({ title: "Couldn't save goal", description: result.error, tone: "error" });
        return;
      }
      toast.push({ title: "Goal saved", description: setterName, tone: "success" });
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium text-text-primary">
        <div className="flex items-center gap-2.5">
          <Avatar name={setterName} size="sm" />
          {setterName}
        </div>
      </TableCell>
      <TableCell className="font-mono tabular-nums text-text-secondary">{formatInt(currentSets)} so far</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={1000}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
            className="h-9 w-24 rounded-[var(--radius-sm)] border border-border-strong bg-surface-2 px-3 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          />
          <Button variant="secondary" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
