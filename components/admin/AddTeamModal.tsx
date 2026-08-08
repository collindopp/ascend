"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createTeamAction } from "@/lib/admin/actions";

export function AddTeamModal() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createTeamAction({ name: formData.get("name") });
      if (!result.ok) {
        toast.push({ title: "Couldn't create team", description: result.error, tone: "error" });
        return;
      }
      toast.push({ title: "Team created", tone: "success" });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Add team
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add team">
        <form action={handleSubmit} className="flex flex-col gap-3">
          <input
            name="name"
            required
            placeholder="Team name"
            className="h-10 rounded-[var(--radius-sm)] border border-border-strong bg-surface-2 px-3 text-sm text-text-primary placeholder:text-text-tertiary"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Creating…" : "Create team"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
