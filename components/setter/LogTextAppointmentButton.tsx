"use client";

import { useState, useTransition } from "react";
import { logTextAppointmentAction } from "@/lib/text-appointments/actions";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function LogTextAppointmentButton({ leadListId, leadListName }: { leadListId: string; leadListName: string }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleLog() {
    startTransition(async () => {
      const result = await logTextAppointmentAction({ leadListId, note: note.trim() || undefined });
      if (!result.ok) {
        toast.push({ title: "Couldn't log it", description: result.error, tone: "error" });
        return;
      }
      toast.push({ title: "Text appointment logged", description: leadListName, tone: "success" });
      setNote("");
      setOpen(false);
    });
  }

  return (
    <>
      <Button variant="secondary" size="sm" className="w-full" onClick={() => setOpen(true)}>
        Log Text Appointment
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Log Text Appointment"
        description={`${leadListName} — no call or session required.`}
      >
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional) — e.g. lead name"
            maxLength={200}
            className="h-9 w-full rounded-[var(--radius-sm)] border border-border-strong bg-surface-2 px-3 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleLog} disabled={isPending}>
              {isPending ? "Logging…" : "Log Appointment"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
